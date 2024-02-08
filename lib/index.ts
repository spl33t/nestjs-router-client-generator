import path from "path";
import { Project, SourceFile, SyntaxKind, Node, TypeReferenceNode, TypeChecker, TypeAliasDeclaration, ClassDeclaration, InterfaceDeclaration, TupleTypeNode } from "ts-morph";
import ts from "typescript"
import fs from "fs"
import { fileURLToPath } from "url";
import { type } from "os";


type INode = {
    name: string,
    content: string
}

let nodes: INode[] = [];
function addNode(value: INode) {
    if (!nodes.find(s => s.name === value.name)) nodes.push(value)
}


// Создаем экземпляр проекта и открываем файл
const project = new Project({ tsConfigFilePath: path.resolve("./tsconfig.json"), });
const apiFile = project.createSourceFile("generated.api.ts", "", { overwrite: true });

function classToInterface(classDeclaration: ClassDeclaration): InterfaceDeclaration {
    // Создаем новый интерфейс
    const interfaceDeclaration = classDeclaration.getSourceFile().addInterface({
        name: classDeclaration.getName()!, // Имя интерфейса берем из класса
    });

    // Перебираем свойства класса
    classDeclaration.getProperties().forEach(property => {
        // Добавляем свойства в интерфейс
        if (property.getType().getCallSignatures().length) {
            return
        }
        interfaceDeclaration.addProperty({
            name: property.getName(),
            type: property.getTypeNode() ? property.getTypeNode()!.getText() : "any",
        });
    });


    // Возвращаем созданный интерфейс
    //console.log(interfaceDeclaration.getText())
    return interfaceDeclaration;
}
function stringifyObject(obj: any): string {
    let result = '{\n';
    for (const key in obj) {
        result += `  '${key}': {\n`;
        const controller = obj[key];
        for (const route in controller) {
            const value = controller[route].replace(/"([^"]+)"/g, (match, p1) => `"${p1}"`);
            result += `    '${route}': ${value},\n`;
        }
        result += '  },\n';
    }
    result += '}';
    return result;
}

function extractTypeReferences(refs: TypeReferenceNode[]) {
    refs.forEach(typeReferenceNode => {
        const nodeType = typeReferenceNode.getType();
        const nodeSymbol = nodeType.getSymbol()
        const nodeSourceFile = typeReferenceNode.getSourceFile()

        if (nodeSymbol) {
            let nodeName = nodeSymbol.getName()
            if (nodeType.isInterface()) {
                const declaration = nodeSymbol.getDeclarations()[0] as InterfaceDeclaration

                if (nodes.find(s => s.name === nodeName))
                    return

                if (!isUtilType(nodeName, nodeSourceFile)) {
                    addNode({ name: nodeName, content: declaration.getText() })
                    const child = declaration.getDescendantsOfKind(SyntaxKind.TypeReference)
                    if (child.length) extractTypeReferences(child)
                }

                return
            }

            if (nodeType.isClass()) {

                const declaration = nodeSymbol.getDeclarations()[0] as ClassDeclaration
                if (nodes.find(s => s.name === nodeName))
                    return

                //Копируем пропы наследуемого класа
                // TODO делать это рекурсивно
                const extendClass = declaration.getBaseClass();
                if (extendClass) {
                    declaration.getProperties().forEach(prop => {
                        const nameProp = prop.getStructure().name
                        if (extendClass.getProperty(nameProp)) {
                            prop.remove()
                            return
                        }
                    })
                    declaration.addProperties(extendClass.getProperties().map(prop => prop.getStructure()))
                }

                // typeof в текст 
                // TODO Иногда вставляется ссылка на импорт
                declaration.getProperties().forEach(prop => {
                    if (prop.getType().isTuple()) prop.setType(prop.getType().getText())
                    if (prop.getType().isUnion()) prop.setType(prop.getType().getText())
                });

                //Удаляем дженерики в extends
                // TODO делать это рекурсивно
                const extendsClause = declaration.getExtends()
                if (extendsClause) {
                    extendsClause.getTypeArguments().forEach(arg => {
                        extendsClause.removeTypeArgument(arg)
                    });
                }

                if (!isUtilType(nodeName, nodeSourceFile)) {
                    addNode({ name: nodeName, content: classToInterface(declaration).getText() })
                    const child = declaration.getDescendantsOfKind(SyntaxKind.TypeReference)

                    if (child.length) extractTypeReferences(child)
                }

                return
            }

            const aliases = nodeType.getAliasSymbol();

            if (aliases) {
                const declaration = aliases.getDeclarations()[0]
                nodeName = aliases.getName()
                if (nodes.find(s => s.name === nodeName))
                    return

                if (!isUtilType(nodeName, nodeSourceFile)) {
                    addNode({ name: nodeName, content: declaration.getText() })
                    const child = declaration.getDescendantsOfKind(SyntaxKind.TypeReference)
                    if (child.length) extractTypeReferences(child)
                }
            }
        }
    })
}


function isUtilType(typeName: string, sourceFile: SourceFile): boolean {
    if (sourceFile.getTypeAlias(typeName)) return false
    if (sourceFile.getClass(typeName)) return false
    if (sourceFile.getEnum(typeName)) return false
    if (sourceFile.getInterface(typeName)) return false
    const imports = sourceFile.getImportDeclarations();
    for (const importDeclaration of imports) {
        const namedImports = importDeclaration.getNamedImports();
        for (const namedImport of namedImports) {
            if (namedImport.getName() === typeName) {
                return false;
            }
        }
    }

    return true;
}

const router = {}

export function run(directory: string, extension: string) {
    const controllerPaths: string[] = [];
    function traverseDirectory(currentDir: string) {
        const items = fs.readdirSync(currentDir);

        for (const item of items) {
            const itemPath = path.join(currentDir, item);
            const stat = fs.statSync(itemPath);

            if (stat.isDirectory()) {
                traverseDirectory(itemPath);
            } else if (stat.isFile() && item.endsWith(extension)) {
                controllerPaths.push(itemPath);
            }
        }
    }

    traverseDirectory(directory)

    controllerPaths.forEach(path => {
        const sourceFile = project.addSourceFileAtPath(path);

        // Ищем класс с декоратором @Controller
        const controllerClass = sourceFile.getClasses().find(classDec => {
            return classDec.getDecorators().some(decorator => decorator.getName() === "Controller");
        });


        if (controllerClass) {
            const controllerName = controllerClass.getName()!
            const routes = {}

            controllerClass
                .getMethods()
                .forEach(method => {
                    let routePath = `${method.getDecorator("Route")?.getArguments()[0].getFullText().replace(/"/g, '')}`;
                    const methodName = `${method.getName()} ${routePath}`

                    const paramsType = method.getParameters().map(s => s.getName() + ": " + s.getTypeNode()?.getText())

                    const returnType = method.getReturnType()
                    const returnNodeSymbol = returnType.getSymbol()
                    let returnTypeText = returnType.getText()

                    if (returnTypeText.includes("import") && returnNodeSymbol) {
                        if (returnType.isClassOrInterface()) {
                            returnTypeText = returnNodeSymbol.getName()
                        } else {
                            const alias = returnType.getAliasSymbol();
                            if (alias) returnTypeText = alias.getName()
                        }
                    }

                    routes[methodName] = `(${paramsType}) => ${returnTypeText}`

                    //Не трогать!!!
                    extractTypeReferences(method.getDescendantsOfKind(SyntaxKind.TypeReference))
                })

            router[controllerName] = routes
        }


    })

    //interface API write
    apiFile.addStatements([`export interface API ${stringifyObject(router)};`]);
    //nodes write
    nodes.forEach(n => { apiFile.addStatements("export " + n.content.replace("export", "").trim()) })
    //create file
    apiFile.saveSync()
}

//console.log(router);
//console.log(nodes.map(s => s.name))

const directoryPath = path.resolve("./src");
const fileExtension = 'app.controller.ts';
run(directoryPath, fileExtension);