"""Task 1: Basic Variables and Conditions

Asks the user for their age and tells them whether they are eligible to vote.
Voting age is 18 or older.
"""


def main():
    # 1. Ask the user to input their age.
    age = int(input("Please enter your age: "))

    # 2. Store the age and check eligibility (18 years or older).
    eligible = age >= 18

    # 3. Display the appropriate message.
    if eligible:
        print("You are eligible to vote!")
    else:
        print("You are not eligible to vote yet.")


if __name__ == "__main__":
    main()
