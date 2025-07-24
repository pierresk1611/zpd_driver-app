import { useState, useEffect } from "react";

export type DeviceType = "mobile" | "tablet" | "desktop";

interface DeviceInfo {
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    // Initial detection on client side
    if (typeof window !== "undefined") {
      return detectDevice();
    }

    // SSR fallback
    return {
      deviceType: "mobile",
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      screenWidth: 375,
      screenHeight: 667,
      userAgent: "",
    };
  });

  useEffect(() => {
    // Set device info on mount and window resize
    const updateDeviceInfo = () => {
      setDeviceInfo(detectDevice());
    };

    updateDeviceInfo();

    // Listen for orientation/resize changes
    window.addEventListener("resize", updateDeviceInfo);
    window.addEventListener("orientationchange", updateDeviceInfo);

    // Force layout lock
    lockDeviceLayout(deviceInfo.deviceType);

    return () => {
      window.removeEventListener("resize", updateDeviceInfo);
      window.removeEventListener("orientationchange", updateDeviceInfo);
    };
  }, []);

  useEffect(() => {
    // Update layout when device type changes
    lockDeviceLayout(deviceInfo.deviceType);
  }, [deviceInfo.deviceType]);

  return deviceInfo;
}

function detectDevice(): DeviceInfo {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const userAgent = navigator.userAgent;

  // Detect device type - prioritize user agent over screen size
  let deviceType: DeviceType = "mobile";

  // Enhanced user agent detection
  const isMobilePhone =
    /Android.*Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
      userAgent,
    ) ||
    (/Android/i.test(userAgent) && !/Tablet/i.test(userAgent));

  const isTabletUA =
    /iPad|Android.*Tablet|Tablet/i.test(userAgent) ||
    (/Android/i.test(userAgent) && /Tablet/i.test(userAgent));

  const isDesktopUA =
    /Windows NT|Macintosh|Linux.*X11/i.test(userAgent) &&
    !isMobilePhone &&
    !isTabletUA;

  // Touch capability detection
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // Device detection priority: User Agent > Touch > Screen Size
  if (isMobilePhone) {
    deviceType = "mobile";
    console.log("📱 Detected mobile phone via User Agent:", userAgent);
  } else if (isTabletUA) {
    deviceType = "tablet";
    console.log("📱 Detected tablet via User Agent:", userAgent);
  } else if (isDesktopUA) {
    deviceType = "desktop";
    console.log("🖥️ Detected desktop via User Agent:", userAgent);
  } else {
    // Fallback to screen width detection
    if (width >= 1024) {
      deviceType = "desktop";
      console.log("🖥️ Detected desktop via screen width:", width);
    } else if (width >= 768 && hasTouch) {
      deviceType = "tablet";
      console.log("📱 Detected tablet via screen width + touch:", width);
    } else {
      deviceType = "mobile";
      console.log("📱 Detected mobile via fallback:", width);
    }
  }

  return {
    deviceType,
    isMobile: deviceType === "mobile",
    isTablet: deviceType === "tablet",
    isDesktop: deviceType === "desktop",
    screenWidth: width,
    screenHeight: height,
    userAgent,
  };
}

function lockDeviceLayout(deviceType: DeviceType) {
  // Apply device-specific body classes
  document.body.className = document.body.className
    .replace(/layout-(mobile|tablet|desktop)/g, "")
    .trim();

  document.body.classList.add(`layout-${deviceType}`);

  // Set CSS custom properties for the device
  const root = document.documentElement;

  switch (deviceType) {
    case "mobile":
      root.style.setProperty("--device-width", "100%");
      root.style.setProperty("--device-padding", "0.5rem");
      root.style.setProperty("--device-gap", "0.5rem");
      break;
    case "tablet":
      root.style.setProperty("--device-width", "100%");
      root.style.setProperty("--device-padding", "1rem");
      root.style.setProperty("--device-gap", "1rem");
      break;
    case "desktop":
      root.style.setProperty("--device-width", "100%");
      root.style.setProperty("--device-padding", "1.5rem");
      root.style.setProperty("--device-gap", "1.5rem");
      break;
  }

  // Disable zooming and scaling
  const viewport = document.querySelector("meta[name=viewport]");
  if (viewport) {
    viewport.setAttribute(
      "content",
      "width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover",
    );
  }

  // Add device-specific data attribute
  document.documentElement.setAttribute("data-device-type", deviceType);

  console.log(
    `🔒 Layout locked to ${deviceType} mode (${root.style.getPropertyValue("--device-width")})`,
  );
}

// Helper function to get layout classes based on device type
export function getDeviceLayoutClasses(deviceType: DeviceType): string {
  const baseClasses = "min-h-screen";

  switch (deviceType) {
    case "mobile":
      return `${baseClasses} layout-mobile mobile-container`;
    case "tablet":
      return `${baseClasses} layout-tablet tablet-container`;
    case "desktop":
      return `${baseClasses} layout-desktop desktop-container`;
    default:
      return `${baseClasses} layout-mobile mobile-container`;
  }
}

// Helper function to get responsive container classes
export function getResponsiveContainerClasses(): string {
  return "responsive-container w-full";
}

// Helper function to get responsive grid classes
export function getResponsiveGridClasses(): string {
  return "responsive-grid w-full";
}
