import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import DealDetailsPage from "@/pages/deal-details-page";
import ProfilePage from "@/pages/profile-page";
import SavedDealsPage from "@/pages/saved-deals-page";
import SearchPage from "@/pages/search-page";
import ModernDealsPage from "@/pages/modern-deals-page";
import CloudinaryTestPage from "@/pages/cloudinary-test";
import CloudinaryUploadPage from "@/pages/cloudinary-upload-page";
import CloudinaryCardsTest from "@/pages/cloudinary-cards-test";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/deal/:id" component={DealDetailsPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/modern-deals" component={ModernDealsPage} />
      <Route path="/cloudinary-test" component={CloudinaryTestPage} />
      <Route path="/cloudinary-upload" component={CloudinaryUploadPage} />
      <Route path="/cloudinary-cards" component={CloudinaryCardsTest} />
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
