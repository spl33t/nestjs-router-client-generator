import { Table } from "../decorators";
import { BaseModel } from "./base.model";
import { ClientModel } from "./client.model";

@Table()
export class OrderModel extends BaseModel<ClientModel>{
    clientId: number
    client: ClientModel
}