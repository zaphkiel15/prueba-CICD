function authorizeRoles(rolesPermitidos) {
    return (req, res, next) => {
        if (req.session.user && rolesPermitidos.includes(req.session.user.rol)) {
            return next();
        }
        res.redirect("/productos"); 
    };
}

module.exports = authorizeRoles;