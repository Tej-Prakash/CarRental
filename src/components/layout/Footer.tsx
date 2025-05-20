
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground py-8 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <div className="mb-4">
          <Link href="/about" className="text-sm hover:text-primary transition-colors px-2">About Us</Link>
          <span className="text-sm text-muted-foreground">|</span>
          <Link href="/learn-more" className="text-sm hover:text-primary transition-colors px-2">Learn More</Link>
          <span className="text-sm text-muted-foreground">|</span>
          <Link href="/cars" className="text-sm hover:text-primary transition-colors px-2">Browse Cars</Link>
          {/* Add other links like Contact, FAQ, Terms of Service as needed */}
        </div>
        <p>&copy; {new Date().getFullYear()} Wheels on Clicks. All rights reserved.</p>
        <p className="text-sm mt-1">Your reliable partner for car rentals.</p>
      </div>
    </footer>
  );
}
