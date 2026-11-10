import type { APIRoute } from 'astro';
import { feedResponse } from '../../data/feed';

export const GET: APIRoute = ({ site }) => feedResponse('es', site!);
