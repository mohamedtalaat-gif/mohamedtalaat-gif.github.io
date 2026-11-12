import test from 'node:test';
import assert from 'node:assert/strict';
import { buildNews, isoDate, isTold, keywords, kindLabel } from '../src/lib/news.js';

const post = (o) => ({ slug: 'p', title: 'A post', date: '2026-01-01', summary: '', topic: 'release', news: true, minutes: 3, text: '', ...o });

test('dates in the formats of the site become ISO prefixes', () => {
  assert.equal(isoDate('2026'), '2026');
  assert.equal(isoDate('2026-09'), '2026-09');
  assert.equal(isoDate('19 Jan 2024'), '2024-01-19');
  assert.equal(isoDate('3 September 2025'), '2025-09-03');
  assert.equal(isoDate('Mar 2023'), '2023-03');
  assert.equal(isoDate('2024 to now'), '2024 to now'); // anything else is left alone
});

test('keywords keep the words that tell events apart', () => {
  const k = keywords('Introduction to Genomic Technologies, with honors: the courses');
  assert.ok(k.has('genomic'));
  assert.ok(!k.has('courses') && !k.has('course')); // a common word
  assert.ok(!k.has('with')); // short
  assert.deepEqual([...keywords('Genomics')], [...keywords('genomic')]); // a plural is the same word
});

test('every post is listed, newest first, with its reading time and a link to the post', () => {
  const n = buildNews({ posts: [post({ slug: 'a', date: '2026-09', title: 'Older' }), post({ slug: 'b', date: '2026-11-05', title: 'Newer', minutes: 5 })] });
  assert.deepEqual(n.map((i) => i.title), ['Newer', 'Older']);
  assert.equal(n[0].href, '/blog/b/');
  assert.equal(n[0].minutes, 5);
});

test('a new post is news without any flag, and news: false leaves it out', () => {
  const n = buildNews({ posts: [post({ slug: 'a', title: 'Shown' }), post({ slug: 'b', title: 'Hidden', news: false })] });
  assert.deepEqual(n.map((i) => i.title), ['Shown']);
});

test('an activity that no post tells is listed on its own and links to where it points', () => {
  const activities = [{ date: '2027-02-10', kind: 'paper', title: 'Calibration of CYP inhibition models', text: 'Accepted.', href: 'https://doi.org/10.1/x' }];
  const n = buildNews({ posts: [post({ title: 'Something else', topic: 'release', date: '2026-09' })], activities });
  assert.equal(n[0].title, 'Calibration of CYP inhibition models');
  assert.equal(n[0].href, 'https://doi.org/10.1/x');
  assert.equal(n[0].source, 'activity');
  assert.equal(buildNews({ activities: [{ date: '2027-02-10', kind: 'award', title: 'An award', text: '' }] })[0].href, '/activities/'); // no link: the Activities page
});

test('an activity and the post that tells it are one item, not two', () => {
  const activities = [
    { date: '2026-11-03', kind: 'course', title: 'Agentic AI in Healthcare, Stanford Medicine Data Ocean', text: 'Forty-hour certificate.' },
    { date: '2025-10-29', kind: 'paper', title: 'Nano-antioxidants for neurodegenerative disorders: a scoping review', text: 'Published in Discover Nano.' },
  ];
  const posts = [
    post({ slug: 's', date: '2026-11-03', topic: 'course', title: 'Stanford Medicine Data Ocean course on agentic AI in healthcare' }),
    post({ slug: 'r', date: '2025-10-29', topic: 'paper', title: 'A scoping review of nano-antioxidants for neurodegenerative disorders' }),
  ];
  const n = buildNews({ posts, activities });
  assert.equal(n.length, 2);
  assert.ok(n.every((i) => i.source === 'post'));
});

test('the same day is not enough: the kind and the words have to agree as well', () => {
  const activity = { date: '2026-11-05', kind: 'result', title: 'OpenADMET CYP Inhibition Blind Challenge: final boards' };
  assert.equal(isTold(activity, post({ date: '2026-11-05', topic: 'release', title: 'CYPMode 0.3.1 archived with a DOI' })), false); // another kind
  assert.equal(isTold(activity, post({ date: '2026-11-04', topic: 'result', title: 'OpenADMET challenge final boards' })), false); // another day
  assert.equal(isTold(activity, post({ date: '2026-11-05', topic: 'result', title: 'Something about weather' })), false); // other words
  assert.equal(isTold(activity, post({ date: '2026-11-05', topic: 'result', title: 'What the final OpenADMET boards say about CYPMode' })), true);
});

test('a hidden post still tells its event, so the event is not listed again', () => {
  const courses = [{ year: 2020, title: 'Programming for Everybody (Getting Started with Python)', by: 'University of Michigan, Coursera' }];
  const hidden = post({ date: '2020', topic: 'course', title: 'Courses in scientific writing, Python, genomics, and pharmacovigilance', news: false, text: 'Programming for Everybody was the first course.' });
  assert.equal(buildNews({ posts: [hidden], courses }).length, 0);
  const fresh = buildNews({ posts: [], courses: [{ year: 2028, title: 'Bayesian Statistics for Scientists', by: 'Some University', href: 'https://example.org/c' }] });
  assert.equal(fresh[0].date, '2028');
  assert.equal(fresh[0].href, 'https://example.org/c');
});

test('a conference is matched by its date, whatever the format, and listed when no post tells it', () => {
  const conferences = [
    { date: '19 Jan 2024', place: 'Cairo, Egypt', title: 'BGICC: Breast Gynecological International Cancer Conference, 16th edition', text: 'Breast workshop.' },
    { date: '2028-05', place: 'Cairo, Egypt', title: 'Cairo Cheminformatics Meeting', text: 'Poster.' },
  ];
  const told = post({ date: '2024-01-19', topic: 'event', title: 'Attending the 16th Breast Gynecological International Cancer Conference' });
  const n = buildNews({ posts: [told], conferences });
  assert.deepEqual(n.map((i) => i.title), ['Cairo Cheminformatics Meeting', told.title]); // the BGICC entry is the post
  assert.equal(n[0].kind, 'event');
  assert.equal(n[0].source, 'conference');
});

test('validation reports make one line for each day, or a line of their own when a day has one', () => {
  const r = (slug, date, title) => ({ slug, date, title, summary: `${title}.` });
  const n = buildNews({ reports: [r('a', '2026-11-05', 'First'), r('b', '2026-11-05', 'Second'), r('c', '2026-09', 'Only')] });
  assert.equal(n.length, 2);
  assert.equal(n[0].title, '2 validation reports');
  assert.equal(n[0].href, '/validation/');
  assert.match(n[0].summary, /First; Second/);
  assert.equal(n[1].href, '/validation/c/');
  assert.equal(kindLabel(n[0]), 'Validation report');
  assert.equal(kindLabel({ kind: 'method' }), 'Method report'); // the interactive method report is a post, not a validation report
  assert.equal(kindLabel({ kind: 'release' }), 'Release');
});

test('on the same date posts come before activities, and everything else by title', () => {
  const n = buildNews({
    posts: [post({ slug: 'z', date: '2026-10', title: 'Zeta', topic: 'role' })],
    activities: [{ date: '2026-10', kind: 'award', title: 'Alpha prize', text: '' }],
    reports: [{ slug: 'q', date: '2026-10', title: 'Report', summary: '' }],
  });
  assert.deepEqual(n.map((i) => i.source), ['post', 'activity', 'report']);
});
