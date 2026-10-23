import type { InterestId } from './roomLayout';

// Copy for the room's four objects and their panels (handoff §4, §6)

export const INTERESTS: { id: InterestId; label: string; buttonLabel: string }[] = [
    { id: 'music', label: 'Music', buttonLabel: 'Music: what I have on repeat' },
    { id: 'games', label: 'Games', buttonLabel: 'Games: what I play most' },
    { id: 'food', label: 'Food', buttonLabel: 'Food: good food I have enjoyed' },
    { id: 'cats', label: 'Cats', buttonLabel: 'Cats: cats I have had' },
];

export const DISHES: { name: string; caption: string; src: string }[] = [
    { name: 'Soy Garlic Chicken Bowl', caption: 'First dish I made after finals. Feels good to relax', src: '/assets/img1.webp' },
    { name: 'Loco Moco', caption: 'The sauce on this amplified everything around it', src: '/assets/img2.webp' },
    { name: 'Japanese Beef Curry Bowl', caption: 'A classic', src: '/assets/img3.webp' },
    { name: 'Sour and Spicy Malatang', caption: 'Perfect for a chilly night', src: '/assets/img4.webp' },
    { name: 'Galbi-jjim', caption: 'Expensive but so worth it', src: '/assets/img5.webp' },
];

export type Cat = { name: string; colour: 'Orange' | 'Calico' | 'Gray'; note: string; photo?: string };

export const CATS: Cat[] = [
    { name: 'Aurora', colour: 'Orange', note: 'The original kitty', photo: '/assets/cats/aurora.webp' },
    { name: 'Sunny', colour: 'Orange', note: "Luna's sibling", photo: '/assets/cats/sunny.webp' },
    { name: 'Luna', colour: 'Calico', note: "Sunny's sibling", photo: '/assets/cats/luna.webp' },
    { name: 'Emma', colour: 'Orange', note: 'Looked after her for a friend', photo: '/assets/cats/emma.webp' },
    { name: 'Cinder', colour: 'Gray', note: 'Short for Cinderella', photo: '/assets/cats/cinder.webp' },
];
