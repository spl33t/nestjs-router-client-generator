import { ClientModel } from "../models/client.model"


export const cities = ["Moscow", "SaintPeterburg"] as const

export class CreateOrderDto  {
    clientId: number
    client: ClientModel
    city: typeof cities[number]
}