"""Lab 1: Variables, Conditions, and Loops

Objective:
    Practice variables, conditional statements (if), and loops
    (while and for) in Python.
"""


def task1_voting_eligibility():
    """Task 1: Basic Variables and Conditions.

    Ask for the user's age and report whether they can vote (18+).
    """
    age = int(input("Enter your age: "))

    if age >= 18:
        print("You are eligible to vote!")
    else:
        print("You are not eligible to vote yet.")


def task2_guessing_game():
    """Task 2: Using a While Loop.

    Keep asking the user to guess until they pick the correct number.
    """
    correct_number = 7

    guess = int(input("Guess a number between 1 and 10: "))
    while guess != correct_number:
        print("Wrong guess, try again.")
        guess = int(input("Guess a number between 1 and 10: "))

    print("Congratulations! You guessed it right!")


def task3_multiplication_table():
    """Task 3: Using a For Loop.

    Print the multiplication table for a number from 1 to 10.
    """
    number = int(input("Enter a number: "))

    for i in range(1, 11):
        print(f"{number} x {i} = {number * i}")


if __name__ == "__main__":
    task1_voting_eligibility()
    task2_guessing_game()
    task3_multiplication_table()
