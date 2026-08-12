export type PackageButtonVariant = 'teal' | 'purple';

export interface PackageItem {
  id: string;
  title: string;
  imageSource: number;
  bullets: string[];
  price: string;
  rating: string;
  buttonLabel: string;
  buttonVariant: PackageButtonVariant;
  description: string;
}

export const PACKAGES: PackageItem[] = [
  {
    id: 'empower-kit',
    title: 'EMPOWER KIT',
    imageSource: require('../assets/images/franchise-outlet-2.jpeg'),
    bullets: [
      'Ideal for small businesses',
      'Complete off-grid kit',
      'Marketing support',
    ],
    price: 'R191 000',
    rating: '4.9',
    buttonLabel: 'Select Package',
    buttonVariant: 'teal',
    description:
      'The Empower Kit is designed for small businesses taking their first step into the off-grid energy market. You receive a full turn-key solution including solar panels, battery storage, an inverter, and all the marketing collateral you need to hit the ground running.',
  },
  {
    id: 'innovative-pro',
    title: 'INNOVATIVE PRO',
    imageSource: require('../assets/images/innovative-pro.jpg'),
    bullets: [
      'Scalable for medium ventures',
      'Advanced energy management',
      'Full brand materials',
    ],
    price: 'R350 000',
    rating: '4.8',
    buttonLabel: 'Select Package',
    buttonVariant: 'purple',
    description:
      'The Innovative Pro is built for growth-stage entrepreneurs ready to serve medium-sized clients. It includes advanced energy management software, scalable hardware configurations, and a complete brand identity toolkit to establish your professional presence.',
  },
  {
    id: 'ultimate-network',
    title: 'ULTIMATE NETWORK',
    imageSource: require('../assets/images/ultimate-network-franchise.jpg'),
    bullets: [
      'Multi-location operations',
      'Priority supply chain',
      'Custom territory rights',
    ],
    price: 'R800 000',
    rating: '5.0',
    buttonLabel: 'Contact a Franchise Expert',
    buttonVariant: 'purple',
    description:
      'The Ultimate Network package is for serious investors and entrepreneurs seeking multi-location dominance. You gain exclusive territorial rights, priority access to our supply chain, a dedicated franchise support manager, and full operational training for your team.',
  },
];
