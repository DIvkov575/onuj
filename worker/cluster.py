"""Clustering pipeline: UMAP → HDBSCAN → GPT-4o-mini labeling."""

import uuid
import logging
import numpy as np
from openai import AsyncOpenAI

log = logging.getLogger(__name__)


def get_hdbscan_params(n: int) -> dict:
    if n < 50:
        return None
    elif n < 500:
        return {"min_cluster_size": 5, "min_samples": 2}
    elif n < 5000:
        return {"min_cluster_size": max(5, n // 80), "min_samples": 3}
    else:
        return {"min_cluster_size": max(10, n // 100), "min_samples": 5}


def run_clustering(embeddings: np.ndarray) -> np.ndarray:
    """UMAP → HDBSCAN. Returns array of int labels (-1 = noise)."""
    from umap import UMAP
    import hdbscan

    params = get_hdbscan_params(len(embeddings))
    if params is None:
        log.info("Not enough conversations to cluster (%d)", len(embeddings))
        return np.full(len(embeddings), -1)

    log.info("Running UMAP on %d embeddings", len(embeddings))
    n_components = min(50, len(embeddings) - 1)
    reducer = UMAP(n_components=n_components, metric="cosine", random_state=42, verbose=False)
    reduced = reducer.fit_transform(embeddings)

    log.info("Running HDBSCAN with params %s", params)
    clusterer = hdbscan.HDBSCAN(**params, core_dist_n_jobs=-1)
    labels = clusterer.fit_predict(reduced)

    n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
    n_noise = np.sum(labels == -1)
    log.info("Found %d clusters, %d noise points", n_clusters, n_noise)

    return labels


async def label_cluster(client: AsyncOpenAI, examples: list[str]) -> str:
    """Ask GPT-4o-mini to name a cluster given example first messages."""
    examples_text = "\n".join(f"- {e}" for e in examples[:8])
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": (
                    "These are example user messages that share a common intent or topic.\n\n"
                    f"{examples_text}\n\n"
                    "Write a 3-6 word label describing what users in this group are trying to do.\n"
                    "Start with an action verb or topic noun.\n"
                    "Good examples: 'Setting up API authentication', 'Billing and payment questions', 'Debugging webhook errors'\n"
                    "Bad examples: 'User questions about...', 'General inquiries', 'Conversations regarding...'\n"
                    "Label only, nothing else."
                ),
            }
        ],
        max_tokens=20,
        temperature=0.3,
    )
    return response.choices[0].message.content.strip().strip('"').strip("'")
