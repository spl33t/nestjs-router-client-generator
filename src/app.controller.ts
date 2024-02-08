import "reflect-metadata"
import { Controller, Route, Query, Body } from "./decorators";
import { CreateUserDto } from "./dtos/create-user.dto";
import { UserModel } from "./models/user.model";
import { CreateOrderDto } from "./dtos/create-order.dto";
import { OrderModel } from "./models/order.model";


type InsideType = {
  what: string
}
interface InsideInterface  {
  what: string
}
class InsideClass {
  anyProp
}
enum InsideEnum {
  A,
  B,
  C
}

@Controller
export class AppController {

 /*  @Route("/createUser")
  createUser(
    @Body body: CreateUserDto
  ) {
    return {} as UserModel
  } */

  @Route("/createOrder")
  createOrder(
    @Body body: CreateOrderDto,
    //insideType: InsideType,
    //insideClass: InsideClass,
    //insideEnum: InsideEnum,
    //insideInterface: InsideInterface
  ) {
    return {} /* as OrderModel */
  }
}
