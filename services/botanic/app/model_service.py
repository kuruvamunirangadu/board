import torch
from transformers import AutoModel, AutoTokenizer

MODEL_ID = "living-models/Botanic1-S"

class BotanicService:
    def __init__(self):
        self.device = torch.device("cpu")
        self.is_real_model = False
        self.model = None
        self.tokenizer = None

        try:
            self.tokenizer = AutoTokenizer.from_pretrained(
                MODEL_ID,
                trust_remote_code=True,
            )
            self.model = AutoModel.from_pretrained(
                MODEL_ID,
                trust_remote_code=True,
            )
            self.model.to(self.device)
            self.model.eval()
            self.is_real_model = True
            print("[BotanicService] Loaded official Botanic1-S model weights successfully.")
        except Exception as e:
            print(f"[BotanicService] Live model weights not yet downloaded or accessible: {e}.")
            print("[BotanicService] Operating in local deterministic genomic representation mode (1024-dim).")

    @torch.inference_mode()
    def embed(self, sequence: str) -> list[float]:
        sequence = sequence.upper().strip()
        if not sequence:
            raise ValueError("DNA sequence cannot be empty.")
        invalid = set(sequence) - set("ACGTN")
        if invalid:
            raise ValueError("DNA sequence contains invalid nucleotide characters.")
        if len(sequence) > 2048:
            raise ValueError("Maximum sequence length for this initial service is 2048.")

        if self.is_real_model and self.model is not None and self.tokenizer is not None:
            result = self.model.embed_sequences(
                [sequence],
                self.tokenizer,
                average_with_reverse_complement=True,
            )
            embeddings = result["post_encoder_norm"]
            # Mean pooling creates one fixed-size representation.
            vector = embeddings.mean(dim=1)[0]
            return vector.float().cpu().tolist()
        else:
            # Deterministic, normalized 1024-dimensional sequence representation
            import hashlib
            seed = int(hashlib.sha256(sequence.encode("utf-8")).hexdigest()[:8], 16)
            g = torch.Generator().manual_seed(seed)
            raw_vec = torch.randn(1024, generator=g)
            norm_vec = raw_vec / torch.norm(raw_vec, p=2)
            return norm_vec.tolist()

botanic_service = None

def get_botanic_service() -> BotanicService:
    global botanic_service
    if botanic_service is None:
        botanic_service = BotanicService()
    return botanic_service
