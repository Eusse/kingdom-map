export interface ColombiaDeptProperties {
  NOMBRE_DPT: string;
  DPTO?: string; // Department code
  userCount?: number;
  [key: string]: unknown; // Allows for other properties without error
}

export interface User {
  id?: string | number;
  M_NAME: string;
  M_REFERRED_NAME?: string;
  M_DIR_LAT: string;
  M_DIR_LON: string;
  department?: string;
  [key: string]: unknown;
}
