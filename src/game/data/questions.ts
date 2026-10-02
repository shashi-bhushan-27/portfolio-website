/**
 * Questions for the DSA Arena, the interview and the final boss. Real engineering
 * judgement, not trivia — several come straight from problems hit in these projects.
 */

export type Question = {
  id: string;
  topic: string;
  prompt: string;
  options: string[];
  answer: number;
  /** Shown after answering, right or wrong. */
  explain: string;
  /** Optional extra line for the DSA Arena. */
  complexity?: string;
};

export const DSA_QUESTIONS: Question[] = [
  {
    id: 'dsa-duplicates',
    topic: 'Hashing',
    prompt: 'You need to find duplicates in a large array. Which approach is most appropriate?',
    options: ['Nested loops', 'Sort, then scan neighbours', 'A hash set', 'Random guessing'],
    answer: 2,
    explain: 'One pass, checking a hash set before inserting. Sorting also works (O(n log n), O(1) extra space) when memory is tight.',
    complexity: 'Time O(n) · Space O(n)',
  },
  {
    id: 'dsa-bfs',
    topic: 'Graphs',
    prompt: 'Shortest path between two rooms on a floor plan where every step costs the same. Which algorithm?',
    options: ['Depth-first search', 'Breadth-first search', 'Bellman-Ford', 'Sort the rooms by name'],
    answer: 1,
    explain: 'BFS visits nodes in order of distance, so the first time it reaches the goal is the shortest path. With a good heuristic, A* explores even less.',
    complexity: 'Time O(V + E) · Space O(V)',
  },
  {
    id: 'dsa-topk',
    topic: 'Heaps',
    prompt: 'Return the k most frequent items from a stream of n events, where k is much smaller than n.',
    options: ['Sort everything by frequency', 'Count with a hash map, keep a min-heap of size k', 'Scan the counts k times', 'Store the stream twice'],
    answer: 1,
    explain: 'Counting is O(n); the heap never grows beyond k, so each push/pop is O(log k).',
    complexity: 'Time O(n log k) · Space O(n + k)',
  },
  {
    id: 'dsa-cycle',
    topic: 'Linked lists',
    prompt: 'Detect a cycle in a linked list using O(1) extra memory.',
    options: ['Remember visited nodes in a hash set', 'Slow and fast pointers (Floyd)', 'Recursion with a depth counter', 'Reverse the list and compare'],
    answer: 1,
    explain: 'If there is a cycle, the fast pointer laps the slow one and they meet. A hash set works too, but costs O(n) memory.',
    complexity: 'Time O(n) · Space O(1)',
  },
  {
    id: 'dsa-rotated',
    topic: 'Binary search',
    prompt: 'Find a value in a sorted array that has been rotated at an unknown pivot.',
    options: ['Linear scan', 'Binary search, deciding which half is still sorted at each step', 'Sort it again, then search', 'Build a hash map first'],
    answer: 1,
    explain: 'At every midpoint one half is sorted; check whether the target lies in it and discard the other half.',
    complexity: 'Time O(log n) · Space O(1)',
  },
];

/** Shown, in rotation, after a wrong DSA answer. */
export const DSA_WRONG_LINES = [
  'That solution works… if you have infinite CPU time.',
  'Time Limit Exceeded on test case 47.',
  'Compiles. Passes the sample. Fails the hidden tests.',
  'Bold. Wrong, but bold.',
];

export const INTERVIEW_QUESTIONS: Question[] = [
  {
    id: 'int-rag',
    topic: 'AI systems',
    prompt: 'What happens when retrieval quality in a RAG system drops?',
    options: [
      'Increase the temperature',
      'Inspect retrieval: embeddings, chunking, indexing and reranking',
      'Change the UI',
      'Switch to a bigger model and hope',
    ],
    answer: 1,
    explain: 'The model can only answer from what it was given. Fix what gets retrieved before touching generation.',
  },
  {
    id: 'int-llm-scoring',
    topic: 'LLM design',
    prompt: 'An LLM grades résumés, and the same résumé gets different scores on different runs. What do you change?',
    options: [
      'Set temperature to 0 and move on',
      'Have the LLM extract evidence into a strict schema, and compute the score in code',
      'Average five runs',
      'Ask the model to be more consistent',
    ],
    answer: 1,
    explain: 'That is how ProofStack works: the model classifies, code decides — identical scores on every rerun, and explainable.',
  },
  {
    id: 'int-ocr',
    topic: 'Document AI',
    prompt: 'A handwritten goods receipt scores 98% OCR confidence, but the extracted quantity is garbage. Why, and what do you do?',
    options: [
      'Trust it — 98% is high',
      'Page averages hide bad lines: measure per-line confidence and route handwriting to a vision model',
      'Run the OCR again until the number changes',
      'Ask the LLM to fix the numbers',
    ],
    answer: 1,
    explain: 'Exactly what happened in Trade Document Intelligence: crisp printed headers inflated the page score while the handwritten table was misread.',
  },
  {
    id: 'int-indoor',
    topic: 'ML in the field',
    prompt: 'Your indoor positioning error jumps from 1.6 m to 4 m in a new building. First move?',
    options: [
      'Retrain from scratch with a deeper network',
      'Check for distribution shift: recalibrate the radio map and let the ensemble re-weight its models',
      'Add access points everywhere',
      'Raise the A* heuristic weight',
    ],
    answer: 1,
    explain: 'New walls and access points change the signal distribution. Recalibrating the fingerprints is cheaper than retraining, and the stacking ensemble adapts its weights.',
  },
];

export const BOSS_QUESTIONS: Question[] = [
  {
    id: 'boss-rate-limit',
    topic: 'System design',
    prompt: 'Design a rate limiter for a public API that runs on several server instances. Where does the counter live?',
    options: [
      'In each server’s memory',
      'In a shared store (Redis or Postgres), incremented atomically per client and time window',
      'In the client’s localStorage',
      'In a cookie the client sends back',
    ],
    answer: 1,
    explain: 'Per-instance counters let a client multiply its limit by the number of servers; anything client-side can be edited.',
  },
  {
    id: 'boss-incident',
    topic: 'Production failure',
    prompt: 'A deploy goes out and the error rate jumps tenfold. What do you do first?',
    options: [
      'Debug it live until it’s fixed',
      'Roll back to the last good version, then investigate with logs and metrics',
      'Restart the database',
      'Wait and see if it settles',
    ],
    answer: 1,
    explain: 'Restore service first; understand it second. A rollback is the fastest known-good state.',
  },
  {
    id: 'boss-eval',
    topic: 'AI evaluation',
    prompt: 'How do you know your LLM extraction is actually good?',
    options: [
      'It looks right on a few examples',
      'A labelled evaluation set: field-level accuracy per model and prompt, over repeated runs',
      'Ask the model to grade itself',
      'Use the newest model',
    ],
    answer: 1,
    explain: 'That is how gpt-oss-120b (48/48) was chosen over gpt-oss-20b (46/48): same documents, three runs each.',
  },
  {
    id: 'boss-realtime',
    topic: 'Trade-offs',
    prompt: 'You need real-time updates in a mobile app whose free-tier backend sleeps after 15 idle minutes.',
    options: [
      'WebSockets held open forever',
      'Push notifications on every state change, plus a cheap polling backstop',
      'Poll every second',
      'Ask users to pull to refresh',
    ],
    answer: 1,
    explain: 'Sockets don’t survive a sleeping server. LendLoop sends an FCM push after each commit, and its QR dialog polls every 4 s as a backstop.',
  },
  {
    id: 'boss-debug',
    topic: 'Debugging',
    prompt: 'An endpoint passes every unit test but returns 500 in production after you add a field to its response. Likely culprit?',
    options: [
      'Flaky tests',
      'Serializing a lazy-loaded relation in an async ORM — and the tests never exercised the wire format',
      'Cosmic rays',
      'The database is down',
    ],
    answer: 1,
    explain: 'A real LendLoop bug: the approve endpoint broke when its response started including the item. The fix was eager loading — and testing what goes over the wire.',
  },
  {
    id: 'boss-communication',
    topic: 'Communication',
    prompt: 'A non-technical stakeholder asks why indoor positioning is “only” accurate to about 1.6 m. You say:',
    options: [
      '“It’s state of the art. Trust me.”',
      '“GPS fails indoors and many systems are off by 3–5 m. 1.6 m puts you in the right room and routes you there.”',
      'Send them the patent application',
      '“Accuracy is a social construct.”',
    ],
    answer: 1,
    explain: 'Anchor the number to what they care about — being in the right room — and to the alternative.',
  },
  {
    id: 'boss-mqtt',
    topic: 'Architecture',
    prompt: 'Why MQTT between the ESP32 gateways and the backend, instead of plain HTTP?',
    options: [
      'It’s newer',
      'Lightweight publish/subscribe suits many small, frequent sensor messages over constrained networks',
      'HTTP can’t carry JSON',
      'MQTT encrypts everything automatically',
    ],
    answer: 1,
    explain: 'Small headers, persistent connections and pub/sub fan-out — a better fit for a stream of signal readings than one HTTP request each.',
  },
];

export const BOSS = {
  hp: 100,
  damage: 25,
  lives: 3,
  taunts: [
    'Interesting. Next question.',
    'Hm. I’ve heard worse.',
    'Okay, but how does it fail?',
    'Let’s go deeper.',
  ],
  ouch: ['That’s not what the job description says.', 'I’ll make a note of that.', 'Let’s… move on.'],
};
