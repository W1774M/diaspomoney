export type providerType = {
  id: string | number;
  name: string;
  type: { id: string | number; value: string };
  specialty: string;
  recommended: boolean;
  apiGeo: {
    place_id: number;
    licence: string;
    osm_type: string;
    osm_id: number;
    lat: string;
    lon: string;
    class: string;
    type: string;
    place_rank: number;
    importance: number;
    addresstype: string;
    name: string;
    display_name: string;
    boundingbox: string[];
  }[];
  images: string[];
  rating: number;
  reviews: number;
  services: { name: string; price: number }[];
};
