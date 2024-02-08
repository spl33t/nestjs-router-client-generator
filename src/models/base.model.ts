import { Table } from "../decorators"

@Table()
export class BaseModel<M> {
    id: number
    createdAt: Date
    updatedAt: Date

    create: () => void
    __model: unknown
}