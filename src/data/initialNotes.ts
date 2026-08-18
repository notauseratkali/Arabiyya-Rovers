import { NoteItem } from '../types';

export const INITIAL_NOTES: NoteItem[] = [
  {
    id: 'note-1',
    title: 'Arabiyya Rover Network Annual Strategic Roadmap & Rovering Charter',
    slug: 'arabiyya-rover-network-annual-roadmap',
    excerpt: 'Detailed overview of the Rover crew goals, crew duties, advancement badges, and upcoming community initiatives.',
    content: `<h2>Arabiyya Rover Network Annual Roadmap</h2>
<p>The Arabiyya Rover Network operates under the motto <strong style="color: #800020;">"Arabiyya Beyond Limits"</strong>, aiming to empower rovers through leadership, service, and outdoor self-reliance.</p>
<h3>Core Pillars</h3>
<ul>
  <li><strong>Leadership &amp; Service:</strong> Active volunteerism for school and community events.</li>
  <li><strong>Expedition &amp; Wilderness Craft:</strong> Bi-annual wilderness navigation and orientation hikes.</li>
  <li><strong>Skill Advancement:</strong> Rover badges, knotting mastery, and emergency first aid certification.</li>
</ul>
<blockquote>All Rover records, crew minutes, and mission notes are to be maintained in the Koshaaru Portal.</blockquote>
<h3>Key Action Points</h3>
<ul>
  <li>Review safety and first aid protocols prior to upcoming expeditions.</li>
  <li>Ensure quartermaster equipment logs are audited by crew leaders.</li>
</ul>`,
    status: 'published',
    category: 'General',
    tags: ['Roadmap', 'Charter', 'Leadership'],
    author: 'Rover Leader',
    authorRole: 'Crew Scribe',
    createdAt: '2026-08-10T10:30:00Z',
    updatedAt: '2026-08-15T14:20:00Z',
    coverColor: '#800020',
    pinned: true,
  },
  {
    id: 'note-2',
    title: 'Draft: Coastal Navigation & Pioneer Camp Logistics Notes',
    slug: 'coastal-navigation-pioneer-camp',
    excerpt: 'Draft equipment checklist, tide charts, and safety gear verification for the Rover camp.',
    content: `<h2>Expedition Checklist &amp; Camp Logistics</h2>
<p><em>Crew briefing draft for the upcoming coastal navigation exercise.</em></p>
<h3>Equipment Checklist</h3>
<ul>
  <li><strong>Medical Kit:</strong> Thermal blankets, antiseptic sprays, sterile dressings (Verified)</li>
  <li><strong>Navigation Gear:</strong> Prismatic compasses and topological marine charts</li>
  <li><strong>Communication:</strong> Dual-band emergency radio transmitters</li>
  <li><strong>Rations &amp; Hydration:</strong> Portable water filtration units and emergency provisions</li>
</ul>
<h3>Tide &amp; Timing Schedule</h3>
<p>High tide is projected at <span style="background-color: #fef08a; padding: 2px 4px; border-radius: 4px;"><strong>14:30</strong></span>. All crew units must complete beacon configuration and site perimeter setup prior to <strong>13:00</strong>.</p>`,
    status: 'draft',
    category: 'Expedition & Hike',
    tags: ['Expedition', 'Checklist', 'Logistics'],
    author: 'Crew Leader Ahmed',
    authorRole: 'Rover Scout',
    createdAt: '2026-08-14T08:15:00Z',
    updatedAt: '2026-08-16T18:45:00Z',
    coverColor: '#1e40af',
    pinned: false,
  },
  {
    id: 'note-3',
    title: 'Crew Council Meeting Minutes - Issue 04',
    slug: 'crew-council-minutes-04',
    excerpt: 'Key discussions on badge assessments, quartermaster supplies, and training schedule.',
    content: `<h2>Crew Council Minutes</h2>
<p><strong>Date:</strong> 12 August 2026 &nbsp;|&nbsp; <strong>Chair:</strong> Crew Advisor &nbsp;|&nbsp; <strong>Attendees:</strong> 14 Rover Crew Members</p>
<hr/>
<h3>Discussions &amp; Decisions</h3>
<ol>
  <li><strong>Advancement Badges:</strong> 5 rovers have successfully demonstrated knotting and pioneer rigging mastery.</li>
  <li><strong>Quartermaster Audit:</strong> Ropes, pioneering poles, and canvas tents inspected. Replacement pegs requested.</li>
  <li><strong>Next Session:</strong> Next Crew Council scheduled for the final Saturday of the month at Arabiyya School.</li>
</ol>`,
    status: 'published',
    category: 'Crew Meeting',
    tags: ['Minutes', 'Council', 'Meeting'],
    author: 'Crew Scribe',
    authorRole: 'Crew Secretary',
    createdAt: '2026-08-12T16:00:00Z',
    updatedAt: '2026-08-12T17:30:00Z',
    coverColor: '#0f1e36',
    pinned: false,
  },
  {
    id: 'note-4',
    title: 'Draft: Emergency First Aid & Wilderness Response Protocol',
    slug: 'draft-emergency-first-aid-protocol',
    excerpt: 'Standardized operational procedures for handling minor injuries, heat exhaustion, and communications during hikes.',
    content: `<h2>Emergency Response Standard Operating Procedures</h2>
<p>Standard guidelines for rovers when managing field incidents during remote training or outdoor activities:</p>
<ol>
  <li><strong>Immediate Assessment:</strong> Survey the scene for hazards before approaching. Assess airway, breathing, and circulation (ABC).</li>
  <li><strong>Contact Network HQ:</strong> Relay exact GPS coordinates and status to the base leader via Koshaaru Portal or radio channel 4.</li>
  <li><strong>Incident Documentation:</strong> Record timestamps, patient symptoms, and all first aid measures applied in this notebook.</li>
</ol>`,
    status: 'draft',
    category: 'Training & Badges',
    tags: ['First Aid', 'Safety', 'Training'],
    author: 'Rover Medic',
    authorRole: 'Safety Officer',
    createdAt: '2026-08-15T09:00:00Z',
    updatedAt: '2026-08-17T08:10:00Z',
    coverColor: '#800020',
    pinned: false,
  },
];
