import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { forwardRef, useEffect, useState } from "react";

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  error?: string;
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
}

// Common country codes for international use
const COUNTRIES = [
  { code: "+33", name: "France", flag: "🇫🇷" },
  { code: "+1", name: "Canada/USA", flag: "🇺🇸" },
  { code: "+44", name: "Royaume-Uni", flag: "🇬🇧" },
  { code: "+49", name: "Allemagne", flag: "🇩🇪" },
  { code: "+32", name: "Belgique", flag: "🇧🇪" },
  { code: "+41", name: "Suisse", flag: "🇨🇭" },
  { code: "+31", name: "Pays-Bas", flag: "🇳🇱" },
  { code: "+34", name: "Espagne", flag: "🇪🇸" },
  { code: "+39", name: "Italie", flag: "🇮🇹" },
  { code: "+351", name: "Portugal", flag: "🇵🇹" },
  { code: "+225", name: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "+221", name: "Sénégal", flag: "🇸🇳" },
  { code: "+237", name: "Cameroun", flag: "🇨🇲" },
  { code: "+234", name: "Nigeria", flag: "🇳🇬" },
  { code: "+233", name: "Ghana", flag: "🇬🇭" },
  { code: "+254", name: "Kenya", flag: "🇰🇪" },
  { code: "+27", name: "Afrique du Sud", flag: "🇿🇦" },
  { code: "+212", name: "Maroc", flag: "🇲🇦" },
  { code: "+213", name: "Algérie", flag: "🇩🇿" },
  { code: "+216", name: "Tunisie", flag: "🇹🇳" },
];

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, error, label, value = "", onChange, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
    const [phoneNumber, setPhoneNumber] = useState("");

    // Initialize phone number from value
    useEffect(() => {
      if (value) {
        // Extract country code and phone number from value
        const countryMatch = COUNTRIES.find(country =>
          value.startsWith(country.code)
        );
        if (countryMatch) {
          setSelectedCountry(countryMatch);
          const phonePart = value.substring(countryMatch.code.length).trim();
          setPhoneNumber(phonePart);
        } else {
          setPhoneNumber(value);
        }
      }
    }, [value]);

    const handleCountrySelect = (country: (typeof COUNTRIES)[0]) => {
      setSelectedCountry(country);
      setIsOpen(false);
      const newValue = `${country.code} ${phoneNumber}`;
      onChange?.(newValue);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newPhoneNumber = e.target.value;
      setPhoneNumber(newPhoneNumber);
      if (selectedCountry) {
        const newValue = `${selectedCountry.code} ${newPhoneNumber}`;
        onChange?.(newValue);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && !(e.target as Element).closest(".phone-input-container")) {
        setIsOpen(false);
      }
    };

    useEffect(() => {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen]);

    if (!selectedCountry) {
      return null;
    }

    return (
      <div className="w-full phone-input-container">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <div className="flex">
            {/* Country Selector */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 px-3 py-2 border border-r-0 border-input bg-background text-sm font-medium rounded-l-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <span className="text-lg">{selectedCountry.flag}</span>
              <span className="hidden sm:inline">{selectedCountry.code}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Phone Input */}
            <input
              className={cn(
                "flex-1 h-10 rounded-r-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                error && "border-error focus-visible:ring-error",
                className
              )}
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="6 12 34 56 78"
              ref={ref}
              {...props}
            />
          </div>

          {/* Country Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 z-50 w-64 mt-1 bg-white border border-input rounded-md shadow-lg max-h-60 overflow-y-auto">
              {COUNTRIES.map(country => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none"
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="font-medium">{country.code}</span>
                  <span className="text-sm text-muted-foreground">
                    {country.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-error">{error}</p>}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
