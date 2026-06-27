export interface ContactPayload {
  subject: string
  message: string
  category: "bug" | "feature" | "billing" | "other"
}
