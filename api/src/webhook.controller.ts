// import { Body, Controller, HttpCode, Post } from '@nestjs/common';
// import { UserService } from './user/user.service';
// import { Role } from '@prisma/client';

// @Controller('webhooks')
// export class WebhookController {
//   constructor(private readonly userService: UserService) {}

//   @Post('clerk')
//   @HttpCode(200)
//   async handleClerkWebhook(@Body() body: any) {
//     if (body.type === 'user.created') {
//       const user = body.data;
//       await this.userService.createFromClerk({
//         id: user.id,
//         email: user.email_addresses?.[0]?.email_address || '',
//         firstName: user.first_name,
//         lastName: user.last_name,
//         avatarUrl: user.image_url,
//         phoneNumber: user.phone_numbers?.[0]?.phone_number,
//         metadata: user.public_metadata,
//         role: Role.USER, // or set based on your logic
//       });
//     }
//     return { received: true };
//   }
// }
