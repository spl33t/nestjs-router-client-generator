export function Controller(constructor: Function) {

}

export function Route(value: string) {
  return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata("route", value, target, propertyKey);
  };
}

export function Body(target: Object, propertyKey: string | symbol, parameterIndex: number) {
  Reflect.defineMetadata("body:param", parameterIndex, target, propertyKey);
}

export function Query(target: Object, propertyKey: string | symbol, parameterIndex: number) {
  const existingParams = Reflect.getMetadata("query:params", target, propertyKey) || [];
  existingParams.push(parameterIndex);
  Reflect.defineMetadata("query:params", existingParams, target, propertyKey);
}

export function PrimaryKey() {
  return (target: Object, propertyKey: string | symbol) => {
      // Reflect.defineMetadata("route", value, target, propertyKey);
  };
}

export function Table() {
  return (target: Object) => {
      // Reflect.defineMetadata("route", value, target, propertyKey);
  };
}