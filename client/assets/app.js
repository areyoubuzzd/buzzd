
// Buzzd App Loader - Production Deployment Version

(function() {
  console.log("Buzzd App Loader: Initializing...");
  
  // First check if the app is already running
  if (document.getElementById('root').children.length > 0) {
    console.log("Buzzd App Loader: App appears to be already loaded");
    return;
  }
  
  // Look for existing script tags with hashed names
  const scripts = Array.from(document.querySelectorAll('script[src^="/assets/index-"]'));
  if (scripts.length > 0) {
    console.log("Buzzd App Loader: Found script:", scripts[0].src);
    return; // Script is already loading correctly
  }
  
  // Look for CSS links to find the pattern of the hashed filename
  const links = Array.from(document.querySelectorAll('link[href^="/assets/index-"]'));
  if (links.length > 0) {
    try {
      const cssHref = links[0].href;
      console.log("Buzzd App Loader: Found CSS:", cssHref);
      
      // Extract the hash pattern from the CSS filename
      const regex = /\/assets\/(index-[^.]+)\.css/;
      const matchResult = cssHref.match(regex);
      
      if (matchResult && matchResult[1]) {
        const baseName = matchResult[1];
        const scriptSrc = `/assets/${baseName}.js`;
        
        console.log("Buzzd App Loader: Loading script:", scriptSrc);
        
        const script = document.createElement('script');
        script.type = 'module';
        script.src = scriptSrc;
        document.head.appendChild(script);
        return;
      }
    } catch (e) {
      console.error("Buzzd App Loader: Error parsing CSS link:", e);
    }
  }
  
  console.log("Buzzd App Loader: No entry points found, using fallback...");
  
  // Fallback option - try to load the client directly
  try {
    const clientScript = document.createElement('script');
    clientScript.type = 'module';
    clientScript.src = '/client/src/main.tsx';
    document.head.appendChild(clientScript);
  } catch (e) {
    console.error("Buzzd App Loader: Failed to load fallback:", e);
  }
})();
