import Hero from "@/app/components/home/Home";
import LimitedDeals from "./components/home/LimitedDeals";
import AirlinePartners from "./components/home/AirlinePartners";
import BlogSection from "./components/home/BlogSection";
import FaqSection from "./components/home/FaqSection";

export default function HomePage() {
    return (
        <>
            <Hero />
            <LimitedDeals />
            <AirlinePartners />
            <BlogSection />
            <FaqSection />
        </>
    );
}