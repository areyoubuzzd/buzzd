import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
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
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeCollection} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/deal/:id" component={DealDetailsPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/beer" component={BeerPage} />
      <Route path="/wine-spirits" component={WineSpiritsPage} />
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
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/saved" component={SavedDealsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
