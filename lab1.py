# Task 1: voting age
age = int(input("Enter your age: "))
if age >= 18:
    print("You are eligible to vote!")
else:
    print("You are not eligible to vote yet.")

# Task 2: guessing game
correct = 7
guess = int(input("Guess a number between 1 and 10: "))
while guess != correct:
    print("Wrong guess, try again.")
    guess = int(input("Guess a number between 1 and 10: "))
print("Congratulations! You guessed it right!")

# Task 3: multiplication table
number = int(input("Enter a number: "))
for i in range(1, 11):
    print(number, "x", i, "=", number * i)
