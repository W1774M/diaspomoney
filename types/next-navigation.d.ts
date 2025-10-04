declare module "next/navigation" {
  export function useRouter(): {
    push: (href: string) => void;
    replace: (href: string) => void;
    back: () => void;
    forward: () => void;
    refresh: () => void;
  };
  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
  export function useParams(): any;
}
