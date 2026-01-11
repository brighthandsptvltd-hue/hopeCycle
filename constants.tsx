
import { DonationStatus, Donation, NGO, Message } from './types';

export const MOCK_DONATIONS: Donation[] = [
  {
    id: '1',
    title: 'Vintage Wooden Dining Set',
    description: 'This beautiful vintage dining set has been in our family for over 20 years. It seats 6 people comfortably.',
    category: 'Furniture',
    condition: 'Good - Minor scratches',
    status: DonationStatus.ACTIVE,
    location: 'Brooklyn, NY',
    postedAt: '2 days ago',
    imageUrl: 'https://images.unsplash.com/photo-1577145745729-0978573bb658?q=80&w=2000&auto=format&fit=crop',
    donorId: 'd1',
    requestsCount: 3
  },
  {
    id: '2',
    title: 'Modern Armchair',
    description: 'Teal fabric armchair, barely used.',
    category: 'Furniture',
    condition: 'New',
    status: DonationStatus.PENDING_PICKUP,
    location: 'Queens, NY',
    postedAt: '1 day ago',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=2000&auto=format&fit=crop',
    donorId: 'd1',
    requestsCount: 1
  },
  {
    id: '3',
    title: 'Box of Children\'s Books',
    description: 'Various educational books for ages 5-10.',
    category: 'Books',
    condition: 'Good',
    status: DonationStatus.COMPLETED,
    location: 'Brooklyn, NY',
    postedAt: '1 week ago',
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=2000&auto=format&fit=crop',
    donorId: 'd1',
    requestsCount: 0
  },
  {
    id: '4',
    title: 'Desk Lamp',
    description: 'Minimalist wooden base lamp.',
    category: 'Household',
    condition: 'New',
    status: DonationStatus.ACTIVE,
    location: 'Manhattan, NY',
    postedAt: '5 days ago',
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=2000&auto=format&fit=crop',
    donorId: 'd1',
    requestsCount: 0
  }
];

export const MOCK_NGOS: NGO[] = [
  {
    id: 'n1',
    name: 'Save the Children',
    category: 'Children\'s Welfare',
    location: 'Brooklyn, NY',
    distance: '1.2km',
    isVerified: true,
    impactScore: 4.9
  },
  {
    id: 'n2',
    name: 'Local Food Bank',
    category: 'Hunger Relief',
    location: 'Queens, NY',
    distance: '3.5km',
    isVerified: true,
    impactScore: 4.7
  },
  {
    id: 'n3',
    name: 'Red Cross',
    category: 'Disaster Relief',
    location: 'Manhattan, NY',
    distance: '5.0km',
    isVerified: true,
    impactScore: 4.8
  }
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'm1',
    senderId: 'n1',
    senderName: 'Save the Children',
    content: 'Hi Sarah! We saw your listing for the dining set. It would be perfect for our local community center.',
    timestamp: '10:30 AM',
    isOwn: false
  },
  {
    id: 'm2',
    senderId: 'd1',
    senderName: 'Sarah',
    content: 'That sounds wonderful! When would you be able to pick it up?',
    timestamp: '10:45 AM',
    isOwn: true
  },
  {
    id: 'm3',
    senderId: 'n1',
    senderName: 'Save the Children',
    content: 'We have a truck in Brooklyn this Thursday afternoon. Does 2 PM work for you?',
    timestamp: '11:02 AM',
    isOwn: false
  }
];
