import UAParser from "ua-parser-js";

const DeviceType = {
  Desktop: "desktop",
  Phone: "phone",
  Tablet: "tablet",
};

class DetectionManager {
  constructor() {
    this.parser = new UAParser();
    this.type = this.determineDeviceType(this.parser.getDevice().type);

    this.isMobile = this.type !== DeviceType.Desktop;
    this.isPhoneChecked = this.type === DeviceType.Phone;
    this.isTabletChecked = this.type === DeviceType.Tablet;
  }

  isPhone() {
    if (!this.isPhoneChecked) {
      this.isPhoneChecked = true;

      this.isPhoneCheck = document.documentElement.classList.contains("phone");
    }

    return this.isPhoneCheck;
  }

  isTablet() {
    if (!this.isTabletChecked) {
      this.isTabletChecked = true;

      this.isTabletCheck = document.documentElement.classList.contains("phone");
    }

    return this.isTabletCheck;
  }

  isDesktop() {
    return !this.isPhone();
  }

  isWebPSupported() {
    if (!this.isWebPChecked) {
      this.isWebPChecked = true;

      const element = document.createElement("canvas");

      if (element.getContext && element.getContext("2d")) {
        this.isWebPCheck =
          element.toDataURL("image/webp").indexOf("data:image/webp") === 0;
      }
    }

    return this.isWebPCheck;
  }

  determineDeviceType(deviceType) {
    if (deviceType === "mobile") {
      return DeviceType.Phone;
    } else if (Object.values(DeviceType).includes(deviceType)) {
      return deviceType;
    } else {
      return DeviceType.Desktop;
    }
  }
}

export const Detection = new DetectionManager();
