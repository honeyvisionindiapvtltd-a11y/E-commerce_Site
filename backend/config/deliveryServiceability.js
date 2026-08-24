const deliveryServiceability = {
  country: "India",
  state: "Odisha",
  // PINs verified against https://api.postalpincode.in/pincode/{PIN} on 2026-08-22.
  // Mixed-block and non-delivery records were excluded from this configuration.
  cities: [
    {
      name: "Bhubaneswar",
      aliases: [],
      enabled: true,
      pincodes: [
        "751001", "751002", "751003", "751004", "751005", "751006",
        "751007", "751008", "751009", "751010", "751011", "751012",
        "751013", "751014", "751015", "751016", "751017", "751018",
        "751019", "751020", "751021", "751022", "751023", "751024",
        "751025", "751030",
      ],
    },
    {
      name: "Khordha",
      aliases: ["Khurda"],
      enabled: true,
      pincodes: ["752018", "752055", "752056", "752057"],
    },
  ],
  serviceablePincodes: [],
  blockedPincodes: [],
};

deliveryServiceability.serviceablePincodes = [
  ...new Set(deliveryServiceability.cities.flatMap((city) => city.pincodes)),
];

export default deliveryServiceability;
