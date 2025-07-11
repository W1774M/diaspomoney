/// mettre une limite aux nombres d'images pour les utilisateurs...

export const providers = [
  {
    id: 1,
    name: "Clinique La Paix 2",
    type: { id: 1, value: "Clinique" },
    specialty: "Médecine générale",
    recommended: true,
    apiGeo: [
      {
        place_id: 35988068,
        licence:
          "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
        osm_type: "node",
        osm_id: 3995348458,
        lat: "6.5555207",
        lon: "2.7428636",
        class: "amenity",
        type: "pharmacy",
        place_rank: 30,
        importance: 6.378194857705071e-5,
        addresstype: "amenity",
        name: "CLINIQUE LA PAIX",
        display_name: "CLINIQUE LA PAIX, Idosa, Ipokia, Ogun, Nigeria",
        boundingbox: ["6.5554707", "6.5555707", "2.7428136", "2.7429136"],
      },
    ],
    images: [
      "/img/Logo_Diaspo_Horizontal_enrichi.webp",
      // Ajoute d'autres images si besoin, mais MAX 5
    ].slice(0, 5),
    rating: 4.8,
    reviews: 124,
    services: [
      {
        name: "Consultation générale",
        price: 50,
      },
      {
        name: "Analyses",
        price: 45,
      },
      {
        name: "Imagerie",
        price: 70,
      },
    ],
    description:
      "Clinique moderne spécialisée en médecine générale et soins de proximité.",
    phone: "+237 699 00 00 01",
    email: "contact@cliniquelapaix2.cm",
    website: "https://cliniquelapaix2.cm",
    availabilities: ["2025/12/12 9:30"], // <= tableau de string, vide par défaut // <= tableau de string, vide par défaut
  },
  {
    id: 2,
    name: "Centre Médical Excellence",
    type: { id: 2, value: "Centre médical" },
    specialty: "Cardiologie",
    recommended: true,
    apiGeo: [
      {
        place_id: 35988068,
        licence:
          "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
        osm_type: "node",
        osm_id: 3995348458,
        lat: "6.5555207",
        lon: "2.7428636",
        class: "amenity",
        type: "pharmacy",
        place_rank: 30,
        importance: 6.378194857705071e-5,
        addresstype: "amenity",
        name: "CLINIQUE LA PAIX",
        display_name: "CLINIQUE LA PAIX, Idosa, Ipokia, Ogun, Nigeria",
        boundingbox: ["6.5554707", "6.5555707", "2.7428136", "2.7429136"],
      },
    ],
    images: [
      "/img/Logo_Diaspo_Horizontal_enrichi.webp",
      // Ajoute d'autres images si besoin, mais MAX 5
    ].slice(0, 5),
    price: 120,
    rating: 4.6,
    reviews: 87,
    services: [
      { name: "Consultation cardiologie", price: 30 },
      { name: "ECG", price: 50 },
      { name: "Suivi patient", price: 50 },
    ],
    description: "Centre médical de référence en cardiologie et suivi patient.",
    phone: "+237 699 00 00 02",
    email: "contact@cmexcellence.cm",
    website: "https://cmexcellence.cm",
    availabilities: [], // <= tableau de string, vide par défaut
  },
  {
    id: 3,
    name: "Dr. Kameni Robert",
    type: { id: 3, value: "Médecin" },
    specialty: "Pédiatrie",
    recommended: false,
    apiGeo: [
      {
        place_id: 35988068,
        licence:
          "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
        osm_type: "node",
        osm_id: 3995348458,
        lat: "6.5555207",
        lon: "2.7428636",
        class: "amenity",
        type: "pharmacy",
        place_rank: 30,
        importance: 6.378194857705071e-5,
        addresstype: "amenity",
        name: "CLINIQUE LA PAIX",
        display_name: "CLINIQUE LA PAIX, Idosa, Ipokia, Ogun, Nigeria",
        boundingbox: ["6.5554707", "6.5555707", "2.7428136", "2.7429136"],
      },
    ],
    images: [
      "/img/Logo_Diaspo_Horizontal_enrichi.webp",
      // Ajoute d'autres images si besoin, mais MAX 5
    ].slice(0, 5),
    distance: "3.7 km",
    price: 60,
    rating: 4.9,
    reviews: 156,
    services: [
      { name: "Consultation pédiatrique", price: 30 },
      { name: "Vaccination", price: 40 },
      { name: "Suivi croissance", price: 50 },
    ],
    description:
      "Médecin pédiatre avec une expertise en vaccination et suivi de croissance.",
    phone: "+237 699 00 00 03",
    email: "contact@drkamenirobert.cm",
    website: "https://drkamenirobert.cm",
    availabilities: [], // <= tableau de string, vide par défaut
  },
  {
    id: 4,
    name: "Dr. Kameni Robert",
    type: { id: 3, value: "Médecin" },
    specialty: "Pédiatrie",
    recommended: false,
    apiGeo: [
      {
        place_id: 35988068,
        licence:
          "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
        osm_type: "node",
        osm_id: 3995348458,
        lat: "6.5555207",
        lon: "2.7428636",
        class: "amenity",
        type: "pharmacy",
        place_rank: 30,
        importance: 6.378194857705071e-5,
        addresstype: "amenity",
        name: "CLINIQUE LA PAIX",
        display_name: "CLINIQUE LA PAIX, Idosa, Ipokia, Ogun, Nigeria",
        boundingbox: ["6.5554707", "6.5555707", "2.7428136", "2.7429136"],
      },
    ],
    images: [
      "/img/Logo_Diaspo_Horizontal_enrichi.webp",
      // Ajoute d'autres images si besoin, mais MAX 5
    ].slice(0, 5),
    distance: "3.7 km",
    price: 60,
    rating: 4.9,
    reviews: 156,
    services: [
      { name: "Consultation pédiatrique", price: 30 },
      { name: "Vaccination", price: 40 },
      { name: "Suivi croissance", price: 50 },
    ],
    description:
      "Médecin pédiatre avec une expertise en vaccination et suivi de croissance.",
    phone: "+237 699 00 00 03",
    email: "contact@drkamenirobert.cm",
    website: "https://drkamenirobert.cm",
    availabilities: [], // <= tableau de string, vide par défaut
  },
  {
    id: 5,
    name: "Dr. Kameni Robert",
    type: { id: 3, value: "Médecin" },
    specialty: "Pédiatrie",
    recommended: false,
    apiGeo: [
      {
        place_id: 35988068,
        licence:
          "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
        osm_type: "node",
        osm_id: 3995348458,
        lat: "6.5555207",
        lon: "2.7428636",
        class: "amenity",
        type: "pharmacy",
        place_rank: 30,
        importance: 6.378194857705071e-5,
        addresstype: "amenity",
        name: "CLINIQUE LA PAIX",
        display_name: "CLINIQUE LA PAIX, Idosa, Ipokia, Ogun, Nigeria",
        boundingbox: ["6.5554707", "6.5555707", "2.7428136", "2.7429136"],
      },
    ],
    images: [
      "/img/Logo_Diaspo_Horizontal_enrichi.webp",
      // Ajoute d'autres images si besoin, mais MAX 5
    ].slice(0, 5),
    distance: "3.7 km",
    price: 60,
    rating: 4.9,
    reviews: 156,
    services: [
      { name: "Consultation pédiatrique", price: 30 },
      { name: "Vaccination", price: 40 },
      { name: "Suivi croissance", price: 50 },
    ],
    description:
      "Médecin pédiatre avec une expertise en vaccination et suivi de croissance.",
    phone: "+237 699 00 00 03",
    email: "contact@drkamenirobert.cm",
    website: "https://drkamenirobert.cm",
    availabilities: [], // <= tableau de string, vide par défaut
  },
  {
    id: 6,
    name: "Dr. Kameni Robert",
    type: { id: 3, value: "Médecin" },
    specialty: "Pédiatrie",
    recommended: false,
    apiGeo: [
      {
        place_id: 35988068,
        licence:
          "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
        osm_type: "node",
        osm_id: 3995348458,
        lat: "6.5555207",
        lon: "2.7428636",
        class: "amenity",
        type: "pharmacy",
        place_rank: 30,
        importance: 6.378194857705071e-5,
        addresstype: "amenity",
        name: "CLINIQUE LA PAIX",
        display_name: "CLINIQUE LA PAIX, Idosa, Ipokia, Ogun, Nigeria",
        boundingbox: ["6.5554707", "6.5555707", "2.7428136", "2.7429136"],
      },
    ],
    images: [
      "/img/Logo_Diaspo_Horizontal_enrichi.webp",
      // Ajoute d'autres images si besoin, mais MAX 5
    ].slice(0, 5),
    distance: "3.7 km",
    price: 60,
    rating: 4.9,
    reviews: 156,
    services: [
      { name: "Consultation pédiatrique", price: 30 },
      { name: "Vaccination", price: 40 },
      { name: "Suivi croissance", price: 50 },
    ],
    description:
      "Médecin pédiatre avec une expertise en vaccination et suivi de croissance.",
    phone: "+237 699 00 00 03",
    email: "contact@drkamenirobert.cm",
    website: "https://drkamenirobert.cm",
    availabilities: [], // <= tableau de string, vide par défaut
  },
  {
    id: 7,
    name: "Hôpital Général De Yaoundé",
    type: { id: 4, value: "Hopital" },
    specialty: "Pédiatrie",
    recommended: false,
    apiGeo: [
      {
        place_id: 34480078,
        licence:
          "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
        osm_type: "way",
        osm_id: 533783280,
        lat: "3.9069181",
        lon: "11.5410073",
        class: "amenity",
        type: "hospital",
        place_rank: 30,
        importance: 0.25725756847226283,
        addresstype: "amenity",
        name: "Hôpital Général De Yaoundé",
        display_name:
          "Hôpital Général De Yaoundé, Rue 1.659, Ngousso, Yaoundé V, Yaoundé, Mfoundi, Région du Centre, Cameroun",
        boundingbox: ["3.9056283", "3.9082400", "11.5398396", "11.5424653"],
      },
      {
        place_id: 34945316,
        licence:
          "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
        osm_type: "way",
        osm_id: 299539855,
        lat: "4.0399909",
        lon: "9.6847605",
        class: "historic",
        type: "building",
        place_rank: 30,
        importance: 0.2049590550690361,
        addresstype: "historic",
        name: "Ancien Hôpital Général",
        display_name:
          "Ancien Hôpital Général, Rue French (N°1.082), Bonanjo, Douala I, Communauté urbaine de Douala, Wouri, Région du Littoral, Cameroun",
        boundingbox: ["4.0393165", "4.0407705", "9.6846598", "9.6848586"],
      },
      {
        place_id: 34944686,
        licence:
          "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
        osm_type: "way",
        osm_id: 192018131,
        lat: "3.9073325",
        lon: "11.5403156",
        class: "amenity",
        type: "mortuary",
        place_rank: 30,
        importance: 7.050049591816613e-5,
        addresstype: "amenity",
        name: "Morgue de l'hôpital Général de Yaoundé",
        display_name:
          "Morgue de l'hôpital Général de Yaoundé, Rue 1.659, Ngousso, Yaoundé V, Yaoundé, Mfoundi, Région du Centre, Cameroun",
        boundingbox: ["3.9071067", "3.9074900", "11.5402065", "11.5404246"],
      },
      {
        place_id: 34537336,
        licence:
          "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
        osm_type: "way",
        osm_id: 192018320,
        lat: "3.9078542",
        lon: "11.5405118",
        class: "amenity",
        type: "mortuary",
        place_rank: 30,
        importance: 7.050049591816613e-5,
        addresstype: "amenity",
        name: "Morgue Hôpital Général",
        display_name:
          "Morgue Hôpital Général, Rue 1.659, Ngousso, Yaoundé V, Yaoundé, Mfoundi, Région du Centre, Cameroun",
        boundingbox: ["3.9076417", "3.9080343", "11.5403874", "11.5405710"],
      },
      {
        place_id: 34584652,
        licence:
          "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
        osm_type: "way",
        osm_id: 455175975,
        lat: "4.0646681",
        lon: "9.7584105",
        class: "amenity",
        type: "hospital",
        place_rank: 30,
        importance: 6.31685358968035e-5,
        addresstype: "amenity",
        name: "Hôpital Général de Douala",
        display_name:
          "Hôpital Général de Douala, Rue Prince, Makepe II Bonamoussadi, Makepe, Douala V, Communauté urbaine de Douala, Wouri, Région du Littoral, Cameroun",
        boundingbox: ["4.0626525", "4.0669346", "9.7565186", "9.7604479"],
      },
      {
        place_id: 34589084,
        licence:
          "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
        osm_type: "node",
        osm_id: 6264765498,
        lat: "4.0407355",
        lon: "9.6844407",
        class: "historic",
        type: "building",
        place_rank: 30,
        importance: 6.31685358968035e-5,
        addresstype: "historic",
        name: "Ancien hôpital général de Douala",
        display_name:
          "Ancien hôpital général de Douala, Rue French (N°1.082), Bonanjo, Douala I, Communauté urbaine de Douala, Wouri, Région du Littoral, Cameroun",
        boundingbox: ["4.0406855", "4.0407855", "9.6843907", "9.6844907"],
      },
      {
        place_id: 34660707,
        licence:
          "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
        osm_type: "node",
        osm_id: 10591290105,
        lat: "4.6363870",
        lon: "9.4726140",
        class: "amenity",
        type: "hospital",
        place_rank: 30,
        importance: 5.000152590214416e-5,
        addresstype: "amenity",
        name: "Hôpital général 3 Corners",
        display_name:
          "Hôpital général 3 Corners, Route Kumba - Mamfé, Kumba, Kumba III, Communauté urbaine de Kumba, Meme, Sud-Ouest, Cameroun",
        boundingbox: ["4.6363370", "4.6364370", "9.4725640", "9.4726640"],
      },
    ],
    images: [
      "/img/Logo_Diaspo_Horizontal_enrichi.webp",
      // Ajoute d'autres images si besoin, mais MAX 5
    ].slice(0, 5),
    distance: "3.7 km",
    price: 60,
    rating: 4.9,
    reviews: 156,
    services: [
      { name: "Consultation pédiatrique", price: 30 },
      { name: "Vaccination", price: 40 },
      { name: "Suivi croissance", price: 50 },
    ],
    description:
      "Médecin pédiatre avec une expertise en vaccination et suivi de croissance.",
    phone: "+237 699 00 00 03",
    email: "contact@drkamenirobert.cm",
    website: "https://drkamenirobert.cm",
    availabilities: ["2025/12/12 9:30"], // <= tableau de string, vide par défaut
  },
];
