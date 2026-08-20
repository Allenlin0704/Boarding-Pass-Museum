document.querySelectorAll(".password-toggle").forEach(button => {

    button.addEventListener("click", () => {

        const id = button.dataset.password;
        const input = document.getElementById(id);

        if (!input) return;

        if (input.type === "password") {

            input.type = "text";
            button.textContent = "🙈";
            button.setAttribute(
                "aria-label",
                "隐藏密码"
            );

        } else {

            input.type = "password";
            button.textContent = "👁";
            button.setAttribute(
                "aria-label",
                "显示密码"
            );

        }

    });

});
