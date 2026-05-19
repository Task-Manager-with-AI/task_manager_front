export default function MeetingRoomLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Full-screen layout: bypass the dashboard sidebar
  return <>{children}</>
}
