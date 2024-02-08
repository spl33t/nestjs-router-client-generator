import { PrimaryKey, Table } from "../decorators";
import { BaseModel } from "./base.model";

export enum UserRoleEnum {
    ADMIN = "ADMIN",
    ONLYREAD = "ONLYREAD"
}

@Table()
export class UserModel extends BaseModel<UserModel>{
    @PrimaryKey()
    login: string
    password: string
    role: UserRoleEnum
}