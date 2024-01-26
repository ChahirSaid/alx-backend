#!/usr/bin/env python3
"""Simple helper function."""
from typing import Tuple


def index_range(page: int, page_size: int) -> Tuple[int, int]:
    """Return tuple of size two containing a start index and an end index."""
    return ((page - 1) * page_size, page * page_size)


if __name__ == "__main__":
    res = index_range(1, 7)
    print(type(res))
    print(res)

    res = index_range(page=3, page_size=15)
    print(type(res))
    print(res)
