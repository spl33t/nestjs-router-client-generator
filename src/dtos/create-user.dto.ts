import { UserRoleEnum } from "../models/user.model"

export class CreateUserDto {
    login: string
    password: string
    role: UserRoleEnum
}