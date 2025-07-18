
// Initial Bengaluru locations for demonstration
export const bengaluruDemoLocations = {
  sources: [
    {
      name: "Electronics City Food Processing",
      lat: 12.8456,
      lng: 77.6641,
      capacity: 5000,
      type: 'source' as const
    },
    {
      name: "Peenya Industrial Area",
      lat: 13.0281,
      lng: 77.5176,
      capacity: 3000,
      type: 'source' as const
    }
  ],
  intermediate: [
    {
      name: "Whitefield Distribution Hub",
      lat: 12.9698,
      lng: 77.7499,
      capacity: 2000,
      type: 'intermediate' as const
    },
    {
      name: "Hebbal Cold Storage",
      lat: 13.0358,
      lng: 77.5972,
      capacity: 1500,
      type: 'intermediate' as const
    }
  ],
  customers: [
    {
      name: "Forum Mall Koramangala",
      lat: 12.9349,
      lng: 77.6197,
      perishabilityHours: 48,
      type: 'customer' as const
    },
    {
      name: "Brigade Road Commercial Street",
      lat: 12.9716,
      lng: 77.6094,
      perishabilityHours: 24,
      type: 'customer' as const
    },
    {
      name: "Indiranagar Market",
      lat: 12.9719,
      lng: 77.6412,
      perishabilityHours: 36,
      type: 'customer' as const
    }
  ]
};

// Demo routes connecting the locations
export const bengaluruDemoRoutes = [
  {
    from: "Electronics City Food Processing",
    to: "Whitefield Distribution Hub",
    distanceKm: 28.5,
    travelTimeHr: 1.2,
    cost: 850
  },
  {
    from: "Peenya Industrial Area", 
    to: "Hebbal Cold Storage",
    distanceKm: 12.3,
    travelTimeHr: 0.8,
    cost: 450
  },
  {
    from: "Whitefield Distribution Hub",
    to: "Forum Mall Koramangala", 
    distanceKm: 15.8,
    travelTimeHr: 0.9,
    cost: 520
  },
  {
    from: "Hebbal Cold Storage",
    to: "Brigade Road Commercial Street",
    distanceKm: 18.2,
    travelTimeHr: 1.1,
    cost: 680
  },
  {
    from: "Hebbal Cold Storage", 
    to: "Indiranagar Market",
    distanceKm: 14.7,
    travelTimeHr: 0.7,
    cost: 480
  }
];
