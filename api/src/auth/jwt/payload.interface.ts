/**
 * Interface representing the JWT payload structure
 */
export interface JwtPayload {
  /** Subject - typically the user ID */
  sub: string;
  /** User's phone number */
  email: string;
  /** User's first name */
}
