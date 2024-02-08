import { Table } from "../decorators";
import { BaseModel } from "./base.model";
import { UserModel } from "./user.model";
import { InferAttributes } from "./utils";

@Table()
export class ClientModel extends BaseModel<InferAttributes<ClientModel, "">> {
    userId: number
    user: UserModel
}