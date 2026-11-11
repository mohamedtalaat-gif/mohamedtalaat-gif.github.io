import { posts } from './posts';
import { activities, courses, conferences } from '../data/site';
import { reports } from '../data/reports';
import { buildNews } from './news.js';

// The News page and the home page. Computed from the posts, the activities, the courses, the conferences and the
// validation reports (see news.js): a new entry in any of them is listed without anything else being edited.
export const news = buildNews({ posts, activities, courses, conferences, reports });
