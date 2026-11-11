"""Manim Mathematical Animation Service

Generates Manim Community scene specifications and step-by-step
mathematical derivation scripts for educational visualization.
"""

from typing import Any, Dict, List


def generate_manim_scene(title: str, steps: List[Dict[str, str]], scene_name: str = "MathDerivationScene") -> Dict[str, Any]:
    safe_scene_name = "".join(c for c in scene_name if c.isalnum() or c == "_") or "MathDerivationScene"
    
    script_lines = [
        "from manim import *",
        "",
        f"class {safe_scene_name}(Scene):",
        "    def construct(self):",
        f'        title = Title("{title}", font_size=38, color=BLUE_B)',
        "        self.play(Write(title))",
        "        self.wait(0.5)",
    ]

    for idx, s in enumerate(steps):
        step_num = idx + 1
        latex = s.get("latex", "").replace("\\", "\\\\")
        expl = s.get("explanation", "").replace('"', '\\"')
        script_lines.extend([
            f"        # Step {step_num}",
            f'        step_{step_num} = MathTex(r"{latex}").scale(1.1)',
            f"        step_{step_num}.next_to(title, DOWN, buff=1.0)",
            f'        expl_{step_num} = Text("{expl}", font_size=24, color=GRAY_B)',
            f"        expl_{step_num}.next_to(step_{step_num}, DOWN, buff=0.6)",
            f"        self.play(Write(step_{step_num}), FadeIn(expl_{step_num}))" if idx == 0 else f"        self.play(Transform(step_{idx}, step_{step_num}), Transform(expl_{idx}, expl_{step_num}))",
            "        self.wait(1.5)",
        ])

    script_lines.extend([
        "        self.wait(2)",
        "",
    ])

    return {
        "scene_name": safe_scene_name,
        "title": title,
        "python_script": "\n".join(script_lines),
        "total_steps": len(steps),
        "generator": "visios-manim-engine",
    }
