#!/bin/bash

#images need to be converted for reasons, see https://www.tensorflow.org/api_docs/python/tf/io/decode_gif

mogrify *.gif -coalesce
