import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page-new";
import HomeCollection from "@/pages/home-collection";
import AuthPage from "@/pages/auth-page";
import DealDetailsPage from "@/pages/deal-details-page";
import ProfilePage from "@/pages/profile-page";
import SavedDealsPage from "@/pages/saved-deals-page";
import SearchPage from "@/pages/search-page";
import BeerPage from "@/pages/beer-page";
import WineSpiritsPage from "@/pages/wine-spirits-page";
import OffersPage from "@/pages/offers-page";
import ModernDealsPage from "@/pages/modern-deals-page";
import CloudinaryTestPage from "@/pages/cloudinary-test";
import CloudinaryUploadPage from "@/pages/cloudinary-upload-page";
import CloudinaryCardsTest from "@/pages/cloudinary-cards-test";
import DrinkCardsTest from "@/pages/drink-cards-test";
import DealImageUploader from "@/pages/deal-image-uploader";
import CardsTestPage from "@/pages/cards-test-page";
import GradientTestPage from "@/pages/gradient-test-page";
import MenuAnalysisPage from "@/pages/menu-analysis-page";
import RestaurantsPage from "@/pages/restaurants-page";
import EstablishmentDetailsPage from "@/pages/establishment-details-page";
import CloudflareImagesTestPage from "@/pages/cloudflare-images-test";
import CloudflareTestImagePage from "@/pages/cloudflare-test-image";
import WorkingImageTest from "@/pages/working-image-test";
import ImageUploadTest from "@/pages/image-upload-test";
import LocalImageTest from "@/pages/local-image-test";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { LocationProvider } from "./contexts/location-context";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/collections" component={HomeCollection} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/deal/:id" component={DealDetailsPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/beer" component={BeerPage} />
      <Route path="/wine-spirits" component={WineSpiritsPage} />
      <Route path="/restaurants" component={RestaurantsPage} />
      <Route path="/establishments/:id" component={EstablishmentDetailsPage} />
      <Route path="/offers" component={OffersPage} />
      <Route path="/modern-deals" component={ModernDealsPage} />
      <Route path="/cloudinary-test" component={CloudinaryTestPage} />
      <Route path="/cloudinary-upload" component={CloudinaryUploadPage} />
      <Route path="/cloudinary-cards" component={CloudinaryCardsTest} />
      <Route path="/drink-cards" component={DrinkCardsTest} />
      <Route path="/deal-images" component={DealImageUploader} />
      <Route path="/cards-test" component={CardsTestPage} />
      <Route path="/gradient-test" component={GradientTestPage} />
      <Route path="/menu-analysis" component={MenuAnalysisPage} />
      <Route path="/cloudflare-images" component={CloudflareImagesTestPage} />
      <Route path="/cloudflare-test-image" component={CloudflareTestImagePage} />
      <Route path="/working-image-test" component={WorkingImageTest} />
      <Route path="/image-upload-test" component={ImageUploadTest} />
      <Route path="/local-image-test" component={LocalImageTest} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/saved" component={SavedDealsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <Router />
        <Toaster />
      </LocationProvider>
    </AuthProvider>
  );
}

export default App;
