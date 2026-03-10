// Web Worker for off-thread clustering and correlation analysis

interface ClusterRequest {
  type: "cluster";
  articles: { id: number; title: string; category: string }[];
}

interface CorrelationRequest {
  type: "correlate";
  signals: { id: string; value: number; timestamp: number }[];
}

type WorkerRequest = ClusterRequest | CorrelationRequest;

interface ArticleCluster {
  id: string;
  title: string;
  articleIds: number[];
  category: string;
  size: number;
}

interface SignalCorrelation {
  signalA: string;
  signalB: string;
  coefficient: number;
}

const FILIPINO_STOP_WORDS = new Set([
  "ang", "ng", "sa", "na", "at", "ay", "mga", "ito", "ni", "si",
  "para", "ko", "mo", "ka", "niya", "nila", "kami", "tayo", "sila",
  "the", "a", "an", "is", "in", "on", "to", "for", "of", "and",
  "with", "by", "from", "that", "this", "was", "are", "has", "have",
  "been", "will", "its", "over", "after", "new", "says", "amid",
]);

function tokenize(text: string): Set<string> {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !FILIPINO_STOP_WORDS.has(t));
  return new Set(tokens);
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function clusterArticles(articles: { id: number; title: string; category: string }[]): ArticleCluster[] {
  const THRESHOLD = 0.35;
  const tokenized = articles.map((a) => ({
    ...a,
    tokens: tokenize(a.title),
  }));

  const assigned = new Set<number>();
  const clusters: ArticleCluster[] = [];

  for (let i = 0; i < tokenized.length; i++) {
    if (assigned.has(i)) continue;

    const cluster: number[] = [i];
    assigned.add(i);

    for (let j = i + 1; j < tokenized.length; j++) {
      if (assigned.has(j)) continue;
      if (tokenized[i].category !== tokenized[j].category) continue;

      const sim = jaccardSimilarity(tokenized[i].tokens, tokenized[j].tokens);
      if (sim >= THRESHOLD) {
        cluster.push(j);
        assigned.add(j);
      }
    }

    if (cluster.length >= 2) {
      clusters.push({
        id: `cluster-${i}`,
        title: tokenized[cluster[0]].title,
        articleIds: cluster.map((idx) => tokenized[idx].id),
        category: tokenized[cluster[0]].category,
        size: cluster.length,
      });
    }
  }

  return clusters.sort((a, b) => b.size - a.size);
}

function correlateSignals(signals: { id: string; value: number; timestamp: number }[]): SignalCorrelation[] {
  const grouped = new Map<string, { value: number; timestamp: number }[]>();
  for (const s of signals) {
    if (!grouped.has(s.id)) grouped.set(s.id, []);
    grouped.get(s.id)!.push({ value: s.value, timestamp: s.timestamp });
  }

  const ids = Array.from(grouped.keys());
  const correlations: SignalCorrelation[] = [];

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = grouped.get(ids[i])!.map((s) => s.value);
      const b = grouped.get(ids[j])!.map((s) => s.value);
      const minLen = Math.min(a.length, b.length);

      if (minLen < 3) continue;

      const sliceA = a.slice(0, minLen);
      const sliceB = b.slice(0, minLen);

      const coeff = pearsonCorrelation(sliceA, sliceB);
      if (Math.abs(coeff) > 0.5) {
        correlations.push({
          signalA: ids[i],
          signalB: ids[j],
          coefficient: Math.round(coeff * 1000) / 1000,
        });
      }
    }
  }

  return correlations.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
  }

  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  if (denominator === 0) return 0;
  return (n * sumXY - sumX * sumY) / denominator;
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { data } = event;

  switch (data.type) {
    case "cluster": {
      const clusters = clusterArticles(data.articles);
      self.postMessage({ type: "cluster-result", clusters });
      break;
    }
    case "correlate": {
      const correlations = correlateSignals(data.signals);
      self.postMessage({ type: "correlate-result", correlations });
      break;
    }
  }
};
