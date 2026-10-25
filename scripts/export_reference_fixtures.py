# -*- coding: utf-8 -*-
"""
Exports reference values from the original Python implementation so the
TypeScript port can be verified against it (see tests/engine.test.ts).

Usage:
    python scripts/export_reference_fixtures.py <path-to-python-project> tests/fixtures/reference.json

Requires numpy, pyyaml and click (the dependencies of the Python project).
"""

import json
import random
import sys

sys.path.insert(0, sys.argv[1])

from constellations import Constellations  # noqa: E402
from initialization import init_constellations  # noqa: E402
from optimization import optimise_constellations  # noqa: E402
from players import Player  # noqa: E402

POSITIONS = ["G", "V", "S"]


def make_players(n, rng):
    players = []
    for i in range(n):
        position = "G" if i < 2 else rng.choice(["V", "S"])
        players.append(Player(f"P{i + 1}", position, round(rng.uniform(0.5, 1.5), 2)))
    return players


def summary_values(constellations: Constellations):
    player_combs = constellations.player_combinations()
    unique = set(player_combs)
    appearances = {}
    for comb in unique:
        n = player_combs.count(comb)
        appearances[n] = appearances.get(n, 0) + 1
    return {
        "fitness": constellations.fitness(),
        "totalPairs": constellations.total_player_combinations(),
        "possiblePairs": constellations.possible_player_combinations(),
        "missingPairs": constellations.total_player_combinations() - len(unique),
        "appearances": {str(k): v for k, v in sorted(appearances.items())},
    }


def export_case(name, constellations, players):
    by_name = {p.name: p for round_players in players for p in round_players}
    return {
        "name": name,
        "players": [
            {"id": p.name, "position": p.position, "strength": p.strength}
            for p in sorted(by_name.values(), key=lambda p: int(p.name[1:]))
        ],
        "weights": {
            "a": constellations.fitness_param_a,
            "b": constellations.fitness_param_b,
            "c": constellations.fitness_param_c,
        },
        "rounds": [
            [[p.name for p in team.players] for team in tc.teams]
            for tc in constellations.constellations
        ],
        "expected": summary_values(constellations),
    }


def main():
    out_path = sys.argv[2]
    rng = random.Random(42)
    random.seed(42)
    cases = []
    configs = [
        # (n_players, n_teams per round, weights, optimise?)
        (8, (2, 2, 2), {}, False),
        (12, (3, 4, 3, 2), {}, True),
        (17, (4, 4, 3), {"a": 100, "b": 1, "c": 5}, True),
        (22, (5, 4, 4, 5, 4), {"a": 120, "b": 0.5, "c": 0}, True),
        (9, (2, 3), {"a": 0, "b": 2, "c": 10}, False),
    ]
    for i, (n_players, n_teams, weights, optimise) in enumerate(configs):
        base = make_players(n_players, rng)
        # vary attendance: every other round one or two players are missing
        players = []
        for r in range(len(n_teams)):
            plyrs = list(base)
            if r % 2 == 1:
                for _ in range(1 + r % 3):
                    plyrs.pop(rng.randrange(2, len(plyrs)))
            players.append(plyrs)
        constellations = init_constellations(len(n_teams), n_teams, tuple(players), weights)
        if optimise:
            constellations = optimise_constellations(constellations, same_fitness_limit=5)
        cases.append(export_case(f"case {i + 1}: {n_players} players, teams {n_teams}", constellations, players))

    with open(out_path, "w") as f:
        json.dump(cases, f, indent=1)
    print(f"Wrote {len(cases)} cases to {out_path}")


if __name__ == "__main__":
    main()
