export class SignupDto {
  fullName: string;
  email: string;
  password: string;
  role: 'CUSTOMER' | 'VENDOR';
}
