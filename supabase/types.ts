import { Database } from "./database.types"

export type DB_Column = Database["public"]["Tables"]["collab_column"]["Row"]
export type DB_Item = Database["public"]["Tables"]["collab_item"]["Row"]
export type DB_User = Database["public"]["Tables"]["collab_users"]["Row"]
export type DB_Collab = Database["public"]["Tables"]["collabs"]["Row"]
export type DB_Profile = Database["public"]["Tables"]["profiles"]["Row"]