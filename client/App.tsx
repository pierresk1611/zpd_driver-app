import "./global.css";

import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Setup from "./pages/Setup";
import Admin from "./pages/Admin";
import CustomerApp from "./pages/CustomerApp";
import NotFound from "./pages/NotFound";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/setup" element={<Setup />} />
      <Route path="/config" element={<Setup />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/shop" element={<CustomerApp />} />
      <Route path="/obchod" element={<CustomerApp />} />
      <Route path="/customer" element={<CustomerApp />} />
      <Route path="/vodicskaapp" element={<Index />} />
      <Route path="/driver" element={<Index />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

createRoot(document.getElementById("root")!).render(<App />);
