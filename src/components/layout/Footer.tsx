export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground py-8 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p>&copy; {new Date().getFullYear()} Wheels on Clicks. All rights reserved.</p>
        <p className="text-sm mt-1">Your reliable partner for car rentals.</p>
      </div>
    </footer>
  );
}
