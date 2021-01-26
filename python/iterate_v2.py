#
l = [3, 9, 6, 7]

for i in range(len(l)):
  for j in range(len(l)):
    if i <= j:
      print(i, j)