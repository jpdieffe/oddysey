#!/usr/bin/env python3
"""Repack hero strips into isolated, foot-anchored frames and validate them.

Requires Pillow, NumPy, and OpenCV. The operation is lossless: pixels are only
translated onto a larger transparent atlas; they are never resampled.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


FRAME_COUNT = 8
ALPHA_THRESHOLD = 8
MIN_COMPONENT_AREA = 24
PADDING = 18


@dataclass
class Pose:
    labels: list[int]
    anchor_x: int
    ground_y: int
    left: int
    top: int
    right: int
    bottom: int


def round16(value: int) -> int:
    return (value + 15) // 16 * 16


def analyze(image: Image.Image) -> tuple[np.ndarray, list[Pose]]:
    rgba = np.asarray(image.convert('RGBA'))
    mask = (rgba[:, :, 3] > ALPHA_THRESHOLD).astype(np.uint8)
    count, labels, stats, centers = cv2.connectedComponentsWithStats(mask, 8)
    source_cell = image.width / FRAME_COUNT

    body_labels: list[int] = []
    for frame in range(FRAME_COUNT):
        x0, x1 = int(frame * source_cell), int((frame + 1) * source_cell)
        candidates: list[tuple[int, int]] = []
        for label in range(1, count):
            area = int(stats[label, cv2.CC_STAT_AREA])
            if area < 300:
                continue
            overlap = int(np.count_nonzero(labels[:, x0:x1] == label))
            if overlap:
                candidates.append((overlap, label))
        if not candidates:
            raise RuntimeError(f'frame {frame}: no character-sized alpha component')
        body_labels.append(max(candidates)[1])
    if len(set(body_labels)) != FRAME_COUNT:
        raise RuntimeError('two nominal frames resolve to the same character component; poses overlap')

    body_x = [float(centers[label][0]) for label in body_labels]
    assignments: list[list[int]] = [[label] for label in body_labels]
    for label in range(1, count):
        if label in body_labels or int(stats[label, cv2.CC_STAT_AREA]) < MIN_COMPONENT_AREA:
            continue
        owner = min(range(FRAME_COUNT), key=lambda i: abs(float(centers[label][0]) - body_x[i]))
        assignments[owner].append(label)

    poses: list[Pose] = []
    for frame, owned in enumerate(assignments):
        body = body_labels[frame]
        ys, xs = np.where(labels == body)
        ground_y = int(ys.max())
        foot_band = xs[ys >= ground_y - max(28, int((ys.max() - ys.min()) * 0.14))]
        anchor_x = int(np.median(foot_band)) if foot_band.size else int(np.median(xs))
        owned_mask = np.isin(labels, owned)
        all_y, all_x = np.where(owned_mask)
        poses.append(Pose(owned, anchor_x, ground_y, int(all_x.min()), int(all_y.min()),
                          int(all_x.max()) + 1, int(all_y.max()) + 1))
    return labels, poses


def normalize(source: Path, destination: Path) -> None:
    image = Image.open(source).convert('RGBA')
    pixels = np.asarray(image)
    labels, poses = analyze(image)
    max_left = max(p.anchor_x - p.left for p in poses)
    max_right = max(p.right - p.anchor_x for p in poses)
    max_above = max(p.ground_y - p.top for p in poses)
    max_below = max(p.bottom - p.ground_y for p in poses)
    cell_w = round16(max(max_left, max_right) * 2 + PADDING * 2)
    cell_h = round16(max_above + max_below + PADDING * 2)
    anchor_x = cell_w // 2
    ground_y = PADDING + max_above
    atlas = np.zeros((cell_h, cell_w * FRAME_COUNT, 4), dtype=np.uint8)

    for frame, pose in enumerate(poses):
        owned = np.isin(labels, pose.labels)
        ys, xs = np.where(owned)
        dx = frame * cell_w + anchor_x - pose.anchor_x
        dy = ground_y - pose.ground_y
        atlas[ys + dy, xs + dx] = pixels[ys, xs]

    destination.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(atlas, 'RGBA').save(destination, optimize=True)
    validate(destination, expected_ground=ground_y)
    widths = ', '.join(str(p.right - p.left) for p in poses)
    print(f'PASS {source.name}: {cell_w}x{cell_h} cells; frame widths [{widths}]; foot anchor ({anchor_x}, {ground_y})')


def validate(path: Path, expected_ground: int | None = None) -> None:
    image = Image.open(path).convert('RGBA')
    alpha = np.asarray(image)[:, :, 3]
    if image.width % FRAME_COUNT:
        raise RuntimeError(f'{path.name}: width is not divisible by {FRAME_COUNT}')
    cell_w = image.width // FRAME_COUNT
    bottoms: list[int] = []
    for frame in range(FRAME_COUNT):
        cell = alpha[:, frame * cell_w:(frame + 1) * cell_w]
        ys, xs = np.where(cell > ALPHA_THRESHOLD)
        if not xs.size:
            raise RuntimeError(f'{path.name} frame {frame}: empty')
        margin = min(int(xs.min()), cell_w - 1 - int(xs.max()), int(ys.min()), image.height - 1 - int(ys.max()))
        if margin < PADDING - 2:
            raise RuntimeError(f'{path.name} frame {frame}: only {margin}px boundary clearance')
        bottoms.append(int(ys.max()))
    if max(bottoms) - min(bottoms) != 0:
        raise RuntimeError(f'{path.name}: foot line jumps by {max(bottoms) - min(bottoms)}px')
    if expected_ground is not None and bottoms[0] != expected_ground:
        raise RuntimeError(f'{path.name}: expected ground {expected_ground}, got {bottoms[0]}')


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--source-dir', type=Path)
    parser.add_argument('--output-dir', type=Path)
    parser.add_argument('--check-dir', type=Path)
    args = parser.parse_args()
    mapping = {
        'odysseus-strip.png': 'odysseus-strip.png',
        'ajax-strip.png': 'ajax-strip.png',
        'circe-strip.png': 'circe-strip.png',
        'atalanta-strip.png': 'atalanta-strip.png',
        'cyclops-strip.png': 'polyphemus-strip.png',
    }
    if args.check_dir:
        for output_name in mapping.values():
            validate(args.check_dir / output_name)
            print(f'PASS {output_name}: isolated frames, safe alpha margins, fixed foot line')
        return
    if not args.source_dir or not args.output_dir:
        parser.error('--source-dir and --output-dir are required unless --check-dir is used')
    for source_name, output_name in mapping.items():
        normalize(args.source_dir / source_name, args.output_dir / output_name)


if __name__ == '__main__':
    main()
